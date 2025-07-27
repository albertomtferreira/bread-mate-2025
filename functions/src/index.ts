// functions/src/index.ts
import { onCall } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { sendNewOrderEmails, sendStatusUpdateEmail } from './emailService';


// Initialize Firebase Admin SDK
initializeApp();

export const handleContactForm = onCall(async (request) => {
  try {
    logger.info(
      'Contact form submission received:',
      JSON.stringify(request.data, null, 2)
    );

    const { name, email, message } = request.data;

    // Basic validation
    if (!name || !email || !message) {
      logger.error('Validation failed: Missing required fields.');
      throw new Error('Missing required fields: name, email, and message are required.');
    }

    const submission = {
      name,
      email,
      message,
      createdAt: FieldValue.serverTimestamp(),
      status: 'new', // Add default status for new messages
    };

    const firestore = getFirestore();
    await firestore.collection('contacts').add(submission);

    logger.info(`Successfully saved contact submission from ${name} (${email})`);

    return {
      success: true,
      message: 'Your message has been received successfully!',
    };

  } catch (error) {
    logger.error('Error in handleContactForm function:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unexpected error occurred while processing the contact form.');
    }
  }
});


export const createOrder = onCall(async (request) => {
  try {
    logger.info(
      `Order payload received for user ${request.auth?.uid || 'guest'}:`,
      JSON.stringify(request.data, null, 2)
    );

    const { 
        subscribeToNewsletter,
        addressLine1, addressLine2, city, postcode,
        deliveryAddressLine1, deliveryAddressLine2, deliveryCity, deliveryPostcode,
        ...orderPayload 
    } = request.data;
    
    // Validate the payload
    if (!orderPayload) {
      logger.error('No payload received');
      throw new Error('Order data is required');
    }
    
    if (!orderPayload.items || !Array.isArray(orderPayload.items) || orderPayload.items.length === 0) {
      logger.error('Invalid items array:', orderPayload.items);
      throw new Error('The function must be called with valid order data, including items.');
    }

    // Determine the delivery address
    const deliveryAddress = orderPayload.deliveryAddress || {
        addressLine1: deliveryAddressLine1 || addressLine1,
        addressLine2: deliveryAddressLine2 || addressLine2,
        city: deliveryCity || city,
        postcode: deliveryPostcode || postcode,
    };


    // Add server-side fields
    const orderData = {
      ...orderPayload,
      deliveryAddress, // Add the structured delivery address
      status: 'Processing',
      createdAt: FieldValue.serverTimestamp(),
      userId: request.auth?.uid || null,
    };

    // Write to Firestore and return the ID
    const firestore = getFirestore();
    const docRef = await firestore.collection('orders').add(orderData);
    const orderId = docRef.id;
    
    logger.info(`Successfully created order ${orderId} for ${orderPayload.customerEmail}`);

    // Handle newsletter subscription if requested
    if (subscribeToNewsletter && orderPayload.customerEmail) {
        logger.info(`Adding ${orderPayload.customerEmail} to the newsletter list.`);
        const newsletterRef = firestore.collection('newsletter').doc(orderPayload.customerEmail);
        await newsletterRef.set({
            email: orderPayload.customerEmail,
            subscribedAt: FieldValue.serverTimestamp()
        }, { merge: true }); // Use merge to avoid overwriting if they are already subscribed
    }
    
    // Send emails after successful order creation
    await sendNewOrderEmails({
        orderId,
        ...orderPayload,
        deliveryAddress, // Pass the correct address to the email function
    });

    const response = {
      orderId: orderId,
      status: 'success',
      message: 'Order created successfully'
    };
    
    return response;
    
  } catch (error) {
    logger.error('Error in createOrder function:', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unexpected error occurred while creating the order.');
    }
  }
});

export const updateOrderStatus = onCall(async (request) => {
    const firestore = getFirestore();

    // Check if the caller is authenticated
    if (!request.auth) {
        logger.error('Unauthorized call to updateOrderStatus: No user is signed in.');
        throw new Error('You must be signed in to perform this action.');
    }

    // Check if the caller is an admin by looking at their Firestore document
    const callingUid = request.auth.uid;
    const userDocRef = firestore.collection('users').doc(callingUid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists || userDoc.data()?.isAdmin !== true) {
        logger.error('Unauthorized attempt to update order status by non-admin UID:', callingUid);
        throw new Error('You must be an admin to perform this action.');
    }
    
    logger.info("Callable request verification passed");

    const { order, status, trackingDetails } = request.data;
    const orderId = order.id;

    if (!order || !orderId || !status) {
        throw new Error("The function must be called with an 'order' object and a 'status'.");
    }

    try {
        const orderRef = firestore.collection('orders').doc(orderId);
        
        let updatePayload: { [key: string]: any } = { status };

        if (status === 'Shipped' && trackingDetails) {
            updatePayload.shippedAt = FieldValue.serverTimestamp();
            updatePayload.trackingProvider = trackingDetails.trackingProvider;
            updatePayload.trackingUrl = trackingDetails.trackingUrl;
            updatePayload.trackingNumber = trackingDetails.trackingNumber;
        } else if (status === 'Delivered') {
            updatePayload.deliveredAt = FieldValue.serverTimestamp();
        }

        await orderRef.update(updatePayload);
        logger.info(`Order ${orderId} status updated to ${status} in Firestore.`);

        if (order.customerEmail) {
            logger.info(`Preparing to send status update email for order ${orderId} to ${order.customerEmail}`);
            await sendStatusUpdateEmail({
                orderId: orderId,
                customerEmail: order.customerEmail,
                status: status,
            });
            logger.info(`Successfully queued status update email for order ${orderId}.`);
        } else {
             logger.warn(`Order ${orderId} is missing a customer email. Skipping notification.`);
        }
        
        return { success: true, message: 'Order status updated successfully.' };

    } catch (error) {
        logger.error('Error updating order status:', error);
         if (error instanceof Error) {
            throw error;
        } else {
            throw new Error('An unexpected error occurred while updating the order status.');
        }
    }
});


export const setUserAdminStatus = onCall(async (request) => {
    if (!request.auth) {
        throw new Error("Authentication required.");
    }

    const callingUid = request.auth.uid;
    const callingUserDocRef = getFirestore().collection('users').doc(callingUid);
    const callingUserDoc = await callingUserDocRef.get();

    if (!callingUserDoc.exists || callingUserDoc.data()?.isAdmin !== true) {
        logger.error('Unauthorized access attempt to setUserAdminStatus by UID:', callingUid);
        throw new Error('You must be an admin to change user roles.');
    }

    const { uid, isAdmin } = request.data;
    if (typeof uid !== 'string' || typeof isAdmin !== 'boolean') {
        throw new Error("The function must be called with a 'uid' (string) and 'isAdmin' (boolean) argument.");
    }

    try {
        // Set custom claim first
        await getAuth().setCustomUserClaims(uid, { isAdmin });
        
        // Then update the Firestore document
        const userDocRef = getFirestore().collection('users').doc(uid);
        await userDocRef.update({ isAdmin });

        // Revoke tokens to force re-authentication with new claims
        await getAuth().revokeRefreshTokens(uid);
        
        logger.info(`Successfully set admin status for user ${uid} to ${isAdmin}. Called by admin: ${callingUid}`);
        return { message: `Success! User ${uid} has been ${isAdmin ? 'made an admin' : 'removed as an admin'}.` };
    } catch (error) {
        logger.error('Error setting user admin status:', error);
        throw new Error('An error occurred while setting the user role.');
    }
});
