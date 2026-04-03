# Database & Storage Schema

This document describes the data models used in BreadMate, including the Firestore collection structures and the Firebase Storage organization.

## Cloud Firestore Collections

### 1. `products`
Stores all bread products available in the store.
- **Fields**:
  - `name`: (string) Product name.
  - `description`: (string) Long description.
  - `price`: (number) Price in the default currency.
  - `image`: (string) URL to the image in Firebase Storage.
  - `alt`: (string) Alt text for the image.
  - `hint`: (string) Short tagline or category (e.g., "Sourdough").
  - `allergens`: (array of strings) List of allergens (e.g., ["Gluten", "Sesame"]).
  - `isAvailable`: (boolean) Availability toggle.
  - `ingredients`: (string) List of ingredients.
  - `nutritionalInfo`: (object)
    - `energy`, `fat`, `saturates`, `carbohydrates`, `sugars`, `fibre`, `protein`, `salt`: (numbers)

### 2. `orders`
Records all customer purchases.
- **Fields**:
  - `customerName`: (string) Name provided during checkout.
  - `customerEmail`: (string) Email for confirmation and tracking.
  - `userId`: (string, optional) UID if the customer was logged in.
  - `items`: (array of objects) Each item contains product details and `quantity`.
  - `total`: (number) Total order value.
  - `deliveryAddress`: (object)
    - `addressLine1`, `addressLine2`, `city`, `postcode`: (strings)
  - `status`: (string) One of `Processing`, `Shipped`, `Delivered`, `Cancelled`.
  - `createdAt`: (timestamp) Time of purchase.
  - `shippedAt`, `deliveredAt`: (timestamp, optional)
  - `trackingProvider`: (string, optional) e.g., "Royal Mail".
  - `trackingNumber`: (string, optional)
  - `trackingUrl`: (string, optional) Direct link to the courier's tracking page.

### 3. `users`
Extended profile information for registered users.
- **Fields**:
  - `isAdmin`: (boolean) Flag for administrative access.
  - `favorites`: (array of strings) List of product IDs favorited by the user.
  - `displayName`, `email`: (strings) Replicated from Firebase Auth for convenience.
  - `addresses`: (array of objects, optional) Saved shipping/billing addresses.

### 4. `contactMessages`
Stores inquiries from the contact form.
- **Fields**:
  - `name`, `email`: (strings) Contact details.
  - `message`: (string) The inquiry content.
  - `createdAt`: (timestamp) Time of submission.
  - `isRead`: (boolean) Status for the admin dashboard.

### 5. `content`
Used for dynamic website text and configuration.
- **Documents**:
  - `carousel`: Contains an array of slide objects (image, title, description).
  - `gallery`: Contains an array of image objects for the gallery section.
  - `settings`: General site configurations (e.g., banner text).

---

## Firebase Storage Structure

Files are organized to separate product images from general site content:

- `/products/`: Contains all product thumbnails and full-size images. Filenames usually match the product name or ID.
- `/carousel/`: Images specifically for the homepage hero carousel.
- `/gallery/`: Images for the website gallery section.
- `/temp/`: Temporary uploads or staged content.

## Security Rules

Access is governed by `firestore.rules`:
- **Read Access**: Generally public for `products`, `content`, and `gallery`.
- **Write Access**: Restricted to authenticated users with `isAdmin: true`, except for `orders` creation and `contactMessages` submission.
- **User Privacy**: Users can only read and write their own data in the `users` collection.
