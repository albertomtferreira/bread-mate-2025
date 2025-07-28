// src/app/api/[[...routes]]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { sendNewOrderEmails, sendStatusUpdateEmail, sendNewContactEmailToAdmin } from '@/lib/emailService';

// Initialize Firebase Admin SDK
// This ensures we have a single instance of the Firebase app.
let adminApp: App;
if (!getApps().length) {
    adminApp = initializeApp();
} else {
    adminApp = getApps()[0];
}

const db = getFirestore(adminApp);
const adminAuth = getAuth(adminApp);

// Helper to verify Firebase ID token and admin status
const verifyAdmin = async (request: NextRequest) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        if (decodedToken.isAdmin === true) {
            return decodedToken;
        }
        return null;
    } catch (error) {
        return null;
    }
};

async function handlePost(request: NextRequest) {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/', '');

    switch (path) {
        case 'contact':
            return handleContactForm(request);
        case 'orders':
            return createOrder(request);
        case 'orders/updateStatus':
            return updateOrderStatus(request);
        case 'users/setAdmin':
            return setUserAdminStatus(request);
        default:
            return new NextResponse('Not Found', { status: 404 });
    }
}

export { handlePost as POST };


// --- Handler Functions (migrated from Cloud Functions) ---

async function handleContactForm(request: NextRequest) {
    try {
        const { name, email, message } = await request.json();

        if (!name || !email || !message) {
            return new NextResponse(JSON.stringify({ message: 'Missing required fields' }), { status: 400 });
        }

        const submission = { name, email, message, createdAt: FieldValue.serverTimestamp(), status: 'new' };
        await db.collection('contacts').add(submission);
        await sendNewContactEmailToAdmin({ name, email, message });
        
        return NextResponse.json({ success: true, message: 'Message received!' });

    } catch (error: any) {
        console.error('Error in handleContactForm:', error);
        return new NextResponse(JSON.stringify({ message: error.message || 'Server error' }), { status: 500 });
    }
}


async function createOrder(request: NextRequest) {
    try {
        const { 
            subscribeToNewsletter,
            addressLine1, addressLine2, city, postcode,
            deliveryAddressLine1, deliveryAddressLine2, deliveryCity, deliveryPostcode,
            ...orderPayload 
        } = await request.json();

        if (!orderPayload.items || orderPayload.items.length === 0) {
            return new NextResponse(JSON.stringify({ message: 'Invalid order items' }), { status: 400 });
        }
        
        // This is a simplified auth check for guest vs logged-in user
        // In a real scenario, you might pass the UID from the client if a user is logged in
        const authHeader = request.headers.get('Authorization');
        let userId = null;
        if(authHeader) {
            const token = authHeader.split('Bearer ')[1];
            try {
                const decodedToken = await adminAuth.verifyIdToken(token);
                userId = decodedToken.uid;
            } catch (e) {
                // Ignore if token is invalid, treat as guest
            }
        }


        const deliveryAddress = orderPayload.deliveryAddress || {
            addressLine1: deliveryAddressLine1 || addressLine1,
            addressLine2: deliveryAddressLine2 || addressLine2,
            city: deliveryCity || city,
            postcode: deliveryPostcode || postcode,
        };

        const orderData = { ...orderPayload, deliveryAddress, status: 'Processing', createdAt: FieldValue.serverTimestamp(), userId: userId };
        const docRef = await db.collection('orders').add(orderData);
        
        if (subscribeToNewsletter && orderPayload.customerEmail) {
            await db.collection('newsletter').doc(orderPayload.customerEmail).set({
                email: orderPayload.customerEmail,
                subscribedAt: FieldValue.serverTimestamp()
            }, { merge: true });
        }

        await sendNewOrderEmails({ orderId: docRef.id, ...orderPayload, deliveryAddress });

        return NextResponse.json({ orderId: docRef.id, status: 'success', message: 'Order created' });

    } catch (error: any) {
        console.error('Error in createOrder:', error);
        return new NextResponse(JSON.stringify({ message: error.message || 'Server error' }), { status: 500 });
    }
}

async function updateOrderStatus(request: NextRequest) {
    const adminUser = await verifyAdmin(request);
    if (!adminUser) {
        return new NextResponse('Unauthorized', { status: 401 });
    }
    try {
        const { order, status, trackingDetails } = await request.json();
        const orderId = order.id;

        if (!orderId || !status) {
            return new NextResponse(JSON.stringify({ message: 'Missing order ID or status' }), { status: 400 });
        }

        const orderRef = db.collection('orders').doc(orderId);
        const updatePayload: { [key: string]: any } = { status };

        if (status === 'Shipped' && trackingDetails) {
            updatePayload.shippedAt = FieldValue.serverTimestamp();
            updatePayload.trackingProvider = trackingDetails.trackingProvider;
            updatePayload.trackingUrl = trackingDetails.trackingUrl;
            updatePayload.trackingNumber = trackingDetails.trackingNumber;
        } else if (status === 'Delivered') {
            updatePayload.deliveredAt = FieldValue.serverTimestamp();
        }

        await orderRef.update(updatePayload);

        if (order.customerEmail) {
            await sendStatusUpdateEmail({ orderId, customerEmail: order.customerEmail, status, trackingDetails });
        }

        return NextResponse.json({ success: true, message: 'Order status updated' });

    } catch (error: any) {
        console.error('Error in updateOrderStatus:', error);
        return new NextResponse(JSON.stringify({ message: error.message || 'Server error' }), { status: 500 });
    }
}

async function setUserAdminStatus(request: NextRequest) {
    const adminUser = await verifyAdmin(request);
     if (!adminUser) {
        return new NextResponse('Unauthorized', { status: 401 });
    }
    try {
        const { uid, isAdmin } = await request.json();

        if (typeof uid !== 'string' || typeof isAdmin !== 'boolean') {
             return new NextResponse(JSON.stringify({ message: 'Invalid payload' }), { status: 400 });
        }

        await adminAuth.setCustomUserClaims(uid, { isAdmin });
        await db.collection('users').doc(uid).update({ isAdmin });
        await adminAuth.revokeRefreshTokens(uid);
        
        return NextResponse.json({ message: `Success! User ${uid} has been ${isAdmin ? 'made an admin' : 'removed as an admin'}.` });

    } catch (error: any) {
        console.error('Error in setUserAdminStatus:', error);
        return new NextResponse(JSON.stringify({ message: error.message || 'Server error' }), { status: 500 });
    }
}