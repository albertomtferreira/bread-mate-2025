# Project Features

This document details the features available in the BreadMate artisan bread e-commerce application.

## Customer Features

### 1. Storefront Experience
- [x] **Homepage**: Features a stunning, full-width hero carousel and a featured products section.
- [x] **Product Catalog**: A grid-based view of all available breads with images, prices, and brief descriptions.
- [x] **Advanced Product Details**: Slim slide-in panels that provide Nutritional Information, Ingredients, and Allergen details.
- [x] **Gallery**: A responsive grid showcasing photos of the baking process and craft.

### 2. Shopping & Checkout
- [x] **Shopping Cart**: Fully persistent cart (using LocalStorage) allowing users to add, update, and remove items.
- [x] **Interactive Add-to-Cart**: The "Add to Basket" button transforms into a quantity stepper once an item is added.
- [x] **Guest Checkout**: Support for users to place orders without creating an account.
- [x] **Multi-Step Checkout**: A streamlined process for managing delivery addresses and simulating payment via PayPal.
- [x] **Order Confirmation**: A success dialog with a summary and a "Print Receipt" feature.
- [x] **Favorites**: Logged-in users can "favorite" items to quickly find them for future orders.

### 3. User Accounts
- [x] **Authentication**: Secure sign-up/sign-in using Email/Password and Google OAuth via Firebase.
- [x] **Email Verification**: Automatic verification emails sent upon new user registration.
- [x] **Order History**: A dedicated section to view past orders and their fulfillment status.
- [x] **Account Management**: Update personal profiles, billing, and shipping addresses.

## Administrative Features

### 1. Management Console
- [x] **Role-Based Access Control**: Secure admin-only routes ensure only authorized users can access the dashboard.
- [x] **At-a-Glance Dashboard**: Quick overview of recent orders, customer counts, and revenue.
- [x] **Unified Notifications**: Notification badges for new orders and contact messages.

### 2. Product & Content Management
- [x] **Product CRUD**: Full interface for creating, editing, and deleting products, including image uploads to Firebase Storage.
- [x] **Inventory Control**: Simple toggle to mark products as available or out of stock.
- [x] **Nutritional Data Management**: Easy-to-use fields for entering detailed nutritional facts.
- [x] **Content Management**: Interactive tools to update the homepage carousel and the gallery directly from the dashboard.

### 3. Order & Shipping
- [x] **Order Processing**: View detailed order summaries and update fulfillment status (Processing, Shipped, Delivered).
- [x] **Courier Management**: Configure courier providers and their tracking URLs.
- [x] **Tracking Information**: Assign tracking numbers and courier links to shipped orders, automatically notifying customers.

### 4. Operations & Communications
- [x] **Analytics**: Interactive charts for viewing sales trends, revenue, and top-selling products.
- [x] **Contact Hub**: View, read, and archive incoming customer messages from the contact form.

## Planned Features (Roadmap)

### 1. Product Enhancements
- [ ] **AI-Powered Descriptions**: Automatically generate product marketing copy based on keywords.
- [ ] **AI Bread Recommender**: A natural language tool to help customers find their perfect bread.

### 2. Operational Tools
- [ ] **Direct Message Reply**: Implementation for replying to customer inquiries directly from the admin dashboard.
- [ ] **reCAPTCHA Integration**: Spam protection for the contact form.
- [ ] **Automatic Nutritional Calculation**: A system to calculate nutrition values based on an ingredient database.

### 3. Analytics Expansion
- [ ] **Favorite Tracking**: Incorporate "favorite" counts into the main analytics dashboard to identify trending items.
- [ ] **Advanced Customer Insights**: Better tracking of customer journeys and retention.
