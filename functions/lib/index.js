"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setUserAdminStatus = exports.updateOrderStatus = exports.createOrder = exports.handleContactForm = void 0;
// functions/src/index.ts
const https_1 = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const emailService_1 = require("./emailService");
// Initialize Firebase Admin SDK
(0, app_1.initializeApp)();
exports.handleContactForm = (0, https_1.onCall)(async (request) => {
    try {
        logger.info('Contact form submission received:', JSON.stringify(request.data, null, 2));
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
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            status: 'new', // Add default status for new messages
        };
        const firestore = (0, firestore_1.getFirestore)();
        await firestore.collection('contacts').add(submission);
        logger.info(`Successfully saved contact submission from ${name} (${email})`);
        // Send email notification to admin
        await (0, emailService_1.sendNewContactEmailToAdmin)({ name, email, message });
        logger.info(`Admin notification email queued for submission from ${email}`);
        return {
            success: true,
            message: 'Your message has been received successfully!',
        };
    }
    catch (error) {
        logger.error('Error in handleContactForm function:', error);
        if (error instanceof Error) {
            throw error;
        }
        else {
            throw new Error('An unexpected error occurred while processing the contact form.');
        }
    }
});
exports.createOrder = (0, https_1.onCall)(async (request) => {
    var _a, _b;
    try {
        logger.info(`Order payload received for user ${((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid) || 'guest'}:`, JSON.stringify(request.data, null, 2));
        const _c = request.data, { subscribeToNewsletter, addressLine1, addressLine2, city, postcode, deliveryAddressLine1, deliveryAddressLine2, deliveryCity, deliveryPostcode } = _c, orderPayload = __rest(_c, ["subscribeToNewsletter", "addressLine1", "addressLine2", "city", "postcode", "deliveryAddressLine1", "deliveryAddressLine2", "deliveryCity", "deliveryPostcode"]);
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
        const orderData = Object.assign(Object.assign({}, orderPayload), { deliveryAddress, status: 'Processing', createdAt: firestore_1.FieldValue.serverTimestamp(), userId: ((_b = request.auth) === null || _b === void 0 ? void 0 : _b.uid) || null });
        // Write to Firestore and return the ID
        const firestore = (0, firestore_1.getFirestore)();
        const docRef = await firestore.collection('orders').add(orderData);
        const orderId = docRef.id;
        logger.info(`Successfully created order ${orderId} for ${orderPayload.customerEmail}`);
        // Handle newsletter subscription if requested
        if (subscribeToNewsletter && orderPayload.customerEmail) {
            logger.info(`Adding ${orderPayload.customerEmail} to the newsletter list.`);
            const newsletterRef = firestore.collection('newsletter').doc(orderPayload.customerEmail);
            await newsletterRef.set({
                email: orderPayload.customerEmail,
                subscribedAt: firestore_1.FieldValue.serverTimestamp()
            }, { merge: true }); // Use merge to avoid overwriting if they are already subscribed
        }
        // Send emails after successful order creation
        await (0, emailService_1.sendNewOrderEmails)(Object.assign(Object.assign({ orderId }, orderPayload), { deliveryAddress }));
        const response = {
            orderId: orderId,
            status: 'success',
            message: 'Order created successfully'
        };
        return response;
    }
    catch (error) {
        logger.error('Error in createOrder function:', error);
        if (error instanceof Error) {
            throw error;
        }
        else {
            throw new Error('An unexpected error occurred while creating the order.');
        }
    }
});
exports.updateOrderStatus = (0, https_1.onCall)(async (request) => {
    var _a;
    const firestore = (0, firestore_1.getFirestore)();
    // Check if the caller is authenticated
    if (!request.auth) {
        logger.error('Unauthorized call to updateOrderStatus: No user is signed in.');
        throw new Error('You must be signed in to perform this action.');
    }
    // Check if the caller is an admin by looking at their Firestore document
    const callingUid = request.auth.uid;
    const userDocRef = firestore.collection('users').doc(callingUid);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists || ((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.isAdmin) !== true) {
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
        let updatePayload = { status };
        if (status === 'Shipped' && trackingDetails) {
            updatePayload.shippedAt = firestore_1.FieldValue.serverTimestamp();
            updatePayload.trackingProvider = trackingDetails.trackingProvider;
            updatePayload.trackingUrl = trackingDetails.trackingUrl;
            updatePayload.trackingNumber = trackingDetails.trackingNumber;
        }
        else if (status === 'Delivered') {
            updatePayload.deliveredAt = firestore_1.FieldValue.serverTimestamp();
        }
        await orderRef.update(updatePayload);
        logger.info(`Order ${orderId} status updated to ${status} in Firestore.`);
        if (order.customerEmail) {
            logger.info(`Preparing to send status update email for order ${orderId} to ${order.customerEmail}`);
            await (0, emailService_1.sendStatusUpdateEmail)({
                orderId: orderId,
                customerEmail: order.customerEmail,
                status: status,
                trackingDetails: trackingDetails,
            });
            logger.info(`Successfully queued status update email for order ${orderId}.`);
        }
        else {
            logger.warn(`Order ${orderId} is missing a customer email. Skipping notification.`);
        }
        return { success: true, message: 'Order status updated successfully.' };
    }
    catch (error) {
        logger.error('Error updating order status:', error);
        if (error instanceof Error) {
            throw error;
        }
        else {
            throw new Error('An unexpected error occurred while updating the order status.');
        }
    }
});
exports.setUserAdminStatus = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new Error("Authentication required.");
    }
    const callingUid = request.auth.uid;
    const callingUserDocRef = (0, firestore_1.getFirestore)().collection('users').doc(callingUid);
    const callingUserDoc = await callingUserDocRef.get();
    if (!callingUserDoc.exists || ((_a = callingUserDoc.data()) === null || _a === void 0 ? void 0 : _a.isAdmin) !== true) {
        logger.error('Unauthorized access attempt to setUserAdminStatus by UID:', callingUid);
        throw new Error('You must be an admin to change user roles.');
    }
    const { uid, isAdmin } = request.data;
    if (typeof uid !== 'string' || typeof isAdmin !== 'boolean') {
        throw new Error("The function must be called with a 'uid' (string) and 'isAdmin' (boolean) argument.");
    }
    try {
        // Set custom claim first
        await (0, auth_1.getAuth)().setCustomUserClaims(uid, { isAdmin });
        // Then update the Firestore document
        const userDocRef = (0, firestore_1.getFirestore)().collection('users').doc(uid);
        await userDocRef.update({ isAdmin });
        // Revoke tokens to force re-authentication with new claims
        await (0, auth_1.getAuth)().revokeRefreshTokens(uid);
        logger.info(`Successfully set admin status for user ${uid} to ${isAdmin}. Called by admin: ${callingUid}`);
        return { message: `Success! User ${uid} has been ${isAdmin ? 'made an admin' : 'removed as an admin'}.` };
    }
    catch (error) {
        logger.error('Error setting user admin status:', error);
        throw new Error('An error occurred while setting the user role.');
    }
});
//# sourceMappingURL=index.js.map