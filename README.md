# BreadMate - Artisan Bread E-commerce Store

BreadMate is a full-featured, production-ready e-commerce web application built with a modern, scalable technology stack. It provides a seamless shopping experience for customers and a comprehensive dashboard for administrators to manage products, orders, content, and more.

## Key Features

### Customer-Facing
- **Homepage:** A stunning, responsive homepage featuring a hero carousel, featured products, and a gallery.
- **Product Catalog:** Browse and view all available products with detailed information.
- **Advanced Product Details:** Customers can view nutritional information, ingredients, and allergen details in a sleek, slide-in panel.
- **User Authentication:** Secure sign-up and sign-in with email/password or Google. Includes email verification and password reset functionality.
- **Shopping Cart:** A fully persistent shopping cart where users can add, remove, and update item quantities.
- **Favorites:** Logged-in users can "favorite" items and easily access them from their account page for quick re-ordering.
- **Streamlined Checkout:** A multi-step checkout process with guest support, address management, and simulated PayPal payment.
- **Account Management:** A dedicated account page for users to view their order history, update personal details, and manage billing/delivery addresses.
- **Contact Form:** A functional contact page for customer inquiries.

### Admin Dashboard
- **Secure Admin Area:** Role-based access control protects all administrative routes.
- **Central Dashboard:** An at-a-glance overview of key store operations and notifications for new orders and messages.
- **Product Management (CRUD):** Full control to create, read, update, and delete products, including images, availability, allergens, and detailed nutritional information.
- **Order Management:** View all orders, check details, and update their status (e.g., Processing, Shipped, Delivered). Admins can also add tracking information.
- **Customer Management:** View a list of all customers, edit their details, and manage their roles (Admin/Customer).
- **Content Management:** Easily update the homepage hero carousel and the gallery by adding, editing, or removing images.
- **Contact Message Hub:** View, read, and archive incoming customer messages.
- **Shipping Management:** Configure courier providers and their tracking URLs for order fulfillment.
- **Business Analytics:** A powerful analytics dashboard to view sales trends, revenue, and top-selling products by a selectable date range.

## Technology Stack

- **Framework:** [Next.js](https.nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [Shadcn/UI](https://ui.shadcn.com/)
- **State Management:** React Context API
- **Backend & Database:** [Firebase](https://firebase.google.com/)
  - **Authentication:** User sign-up, sign-in, and session management.
  - **Firestore:** NoSQL database for products, orders, users, and content.
  - **Storage:** Cloud storage for product, carousel, and gallery images.
  - **Cloud Functions:** Backend logic for processing orders and sending emails (migrated to Next.js API Routes for this project).
- **Email Service:** [Brevo (formerly Sendinblue)](https://www.brevo.com/) for transactional emails (order confirmations, status updates).
- **Form Handling:** [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) for validation.

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)
- An active [Firebase](https://firebase.google.com/) project.
- A [Brevo](https://www.brevo.com/) account for sending emails.

### 1. Clone the Repository
```bash
git clone <repository-url>
cd bread-mate-2025
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Firebase Setup
1. Go to your [Firebase Console](https://console.firebase.google.com/).
2. Create a new project (or use an existing one).
3. In your project settings, find your Firebase configuration object for a web app. You will need these keys for your environment file.
4. Enable the following services:
   - **Authentication:** Enable Email/Password and Google sign-in methods.
   - **Firestore:** Create a database.
   - **Storage:** Create a storage bucket.

### 4. Environment Variables
Create a `.env` file in the root of the project and add your Firebase and Brevo credentials.

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=1:...:web:...

# Email Service (Brevo)
BREVO_KEY=xkeysib-...
FROM_EMAIL=your-sender-email@example.com
ADMIN_EMAIL=your-admin-email@example.com
```

### 5. Run the Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:9004`.
