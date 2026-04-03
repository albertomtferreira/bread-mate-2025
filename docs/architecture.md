# Project Architecture

This document provides a technical overview of the BreadMate application architecture, technology stack, and directory structure.

## Technology Stack

The application is built using a modern, scalable web stack:

- **Frontend Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn/UI](https://ui.shadcn.com/) (based on Radix UI)
- **Backend & Database**: [Firebase](https://firebase.google.com/)
  - **Authentication**: Firebase Auth (Email/Password & Google)
  - **Database**: Cloud Firestore (NoSQL)
  - **Storage**: Firebase Cloud Storage (for images)
- **Email Service**: [Brevo](https://www.brevo.com/) for transactional emails.
- **Form Management**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) validation.

## Directory Structure

The project follows a standard Next.js directory structure with some custom additions for Firebase logic and local services:

```text
/
├── public/             # Static assets (favicons, etc.)
├── src/
│   ├── app/            # Next.js App Router (pages and API routes)
│   ├── components/     # Reusable UI components (shadcn and custom)
│   │   ├── admin/      # Components specific to the Admin Dashboard
│   │   ├── checkout/   # Multi-step checkout components
│   │   └── ui/         # Base UI components from Radix/Shadcn
│   ├── contexts/       # React Context providers (Auth, Cart, Notification)
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions and service initializations
│   ├── services/       # Business logic (e.g., Firestore queries, email triggers)
│   └── types/          # TypeScript interface and type definitions
├── docs/               # Project documentation
├── functions/          # (Legacy/Optional) Firebase Cloud Functions
├── firebase.json       # Firebase configuration
└── firestore.rules     # Security rules for Firestore
```

## Data Flow

1. **Authentication**: Handled via `AuthContext.tsx`, which wraps the application and provides current user state and role-based access information.
2. **State Management**:
   - `CartContext.tsx`: Manages the shopping cart state, persisted to local storage.
   - `NotificationContext.tsx`: Handles application-wide notifications (toasts/badges).
3. **Database Interactions**: Mostly handled within the components or services using the Firebase Web SDK.
4. **API Routes**: Located in `src/app/api/`, these handle server-side operations like sending emails via Brevo or processing simulated payments.

## Design System

The application uses a warm, artisan-inspired color palette:
- **Primary**: Warm Bread (#A66321)
- **Background**: Light Beige (#F5F5DC)
- **Accent**: Burnt Orange (#CC7722)

Typography is a mix of 'Playfair Display' for headlines and 'PT Sans' for body text, providing a balance of elegance and readability.
