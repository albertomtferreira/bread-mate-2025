# API Documentation

The BreadMate application uses Next.js Route Handlers to perform server-side operations. All API routes are located under `src/app/api/` and utilize the `firebase-admin` SDK for secure database and authentication management.

## Authentication

Admin-restricted endpoints require a Firebase ID Token passed in the `Authorization` header:

```http
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

The server verifies the token and checks for the `isAdmin: true` custom claim.

---

## Endpoints

### 1. Contact Form Submission
**URL**: `/api/contact`  
**Method**: `POST`  
**Description**: Submits a message from the contact form.
- **Payload**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Hello, I have a question about your sourdough."
  }
  ```
- **Actions**:
  1. Saves the submission to the `contacts` Firestore collection.
  2. Sends a notification email to the site administrator via Brevo.

### 2. Create Order
**URL**: `/api/orders`  
**Method**: `POST`  
**Description**: Processes a new customer order.
- **Payload**:
  ```json
  {
    "customerName": "Jane Smith",
    "customerEmail": "jane@example.com",
    "items": [...],
    "total": 45.00,
    "deliveryAddress": { ... },
    "subscribeToNewsletter": true
  }
  ```
- **Actions**:
  1. Verifies items and customer details.
  2. Saves the order to the `orders` Firestore collection with `status: "Processing"`.
  3. If `subscribeToNewsletter` is true, adds the email to the `newsletter` collection.
  4. Sends order confirmation emails to both the customer and the administrator.

### 3. Update Order Status (Admin Only)
**URL**: `/api/orders/updateStatus`  
**Method**: `POST`  
**Description**: Updates the fulfillment status of an existing order.
- **Payload**:
  ```json
  {
    "order": { "id": "ORDER_ID", "customerEmail": "..." },
    "status": "Shipped",
    "trackingDetails": {
      "trackingProvider": "Royal Mail",
      "trackingNumber": "XYZ123",
      "trackingUrl": "https://..."
    }
  }
  ```
- **Actions**:
  1. Updates the order document in Firestore.
  2. If status is `Shipped`, records `shippedAt` timestamp and tracking info.
  3. If status is `Delivered`, records `deliveredAt` timestamp.
  4. Sends a status update email to the customer.

### 4. Set User Admin Status (Admin Only)
**URL**: `/api/users/setAdmin`  
**Method**: `POST`  
**Description**: Grants or revokes administrative privileges for a user.
- **Payload**:
  ```json
  {
    "uid": "USER_ID",
    "isAdmin": true
  }
  ```
- **Actions**:
  1. Sets custom user claims in Firebase Auth.
  2. Updates the `isAdmin` field in the user's Firestore document.
  3. Revokes existing refresh tokens to force a re-login with the new claims.
