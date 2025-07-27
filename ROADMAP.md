
# Flourish & Dough - Project Roadmap

This document tracks the features and progress for the Flourish & Dough application.

---

## Phase 1: Core E-commerce Functionality (v1.0)

### 1.1. Storefront & Pages
- [x] **Homepage:** Create a visually appealing homepage with a hero carousel, product section, and gallery.
- [x] **Order Page:** Display all available products for sale.
- [x] **Contact Page:** A form for users to send messages to the business.
- [x] **Responsive Design:** Ensure the application works seamlessly on desktop and mobile devices.

### 1.2. User Authentication
- [x] **Email/Password:** Standard sign-up and sign-in functionality.
- [x] **Google Sign-In:** Allow users to authenticate with their Google account.
- [x] **Account Page:** A dedicated page for logged-in users to manage their details and view order history.
- [x] **Email Verification:** Send a verification email upon sign-up.

### 1.3. Shopping & Checkout
- [x] **Product Catalog:** Products are fetched from the database and displayed.
- [x] **Shopping Cart:** Users can add, remove, and update quantities of items.
- [x] **Guest Checkout:** Allow users to purchase without creating an account.
- [x] **Order Placement:** Save order details to the database.
- [x] **Order Confirmation:** Display a success dialog after a successful purchase.
- [x] **Print Receipt:** Allow users to print their order confirmation.
- [x] **Newsletter Signup:** Option during checkout to subscribe to a newsletter.

---

## Phase 2: Admin Dashboard & Operations (v1.5)

### 2.1. Core Admin Functionality
- [x] **Secure Admin Area:** Role-based access control to protect admin routes.
- [x] **Admin Dashboard:** A central hub for managing all aspects of the store.
- [x] **Customer Management:** View and edit customer details and manage user roles (Admin/Customer).
- [x] **Shipping Management:** Add, edit, and delete courier information for order tracking.
- [x] **Contact Management:** View, read, and archive incoming customer messages.

### 2.2. Content & Product Management
- [x] **Product Management (CRUD):** Full capabilities to create, read, update, and delete products, including images and allergen information.
- [x] **Carousel Management:** Add, edit, and delete slides for the homepage hero carousel.
- [x] **Gallery Management:** Add, edit, and delete images in the website gallery.

### 2.3. Analytics & Notifications
- [x] **Business Analytics:** A dashboard to view sales trends, revenue, and top-selling products by date range.
- [x] **Unified Admin Notifications:** Display a notification badge in the header and on the dashboard for new orders and messages.

---

## Phase 3: Enhancements & Integrations (Future)

### 3.1. Notifications & Communication
- [x] **Real Email Provider (M):** Replace the placeholder email logger with a real email service (e.g., SendGrid, Mailgun) for sending transactional emails.
- [x] **Admin Email for New Contact (S):** Send an email notification to an admin when a new contact form message is submitted.
- [ ] **Direct Reply to Messages (L):** Implement functionality to reply to customer messages directly from the admin portal.
- [ ] **reCAPTCHA (M):** Add reCAPTCHA to the contact form to prevent spam.

### 3.2. Product & Store Enhancements
- [ ] **Nutritional Information (M):** Add fields for nutritional details (calories, fat, etc.) to products and display them.
- [ ] **Favorite Items (L):** Allow logged-in users to "favorite" products for easy access later.

### 3.3. AI-Powered Features
- [ ] **AI-Powered Product Descriptions (M):** Build a tool for admins to generate product descriptions using AI by providing simple keywords.
- [ ] **AI Bread Recommender (L):** A tool for customers to get product recommendations based on natural language queries.
- [ ] **AI Contact Form Analysis (L):** Automatically categorize and prioritize incoming contact messages using AI.

