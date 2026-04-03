# Development Guide

This document provides instructions for setting up the development environment and contributing to the BreadMate project.

## Prerequisites

- **Node.js**: Version 18 or later is required.
- **Firebase Project**: An active Firebase project with Authentication, Firestore, and Storage enabled.
- **Brevo Account**: For transactional email functionality.

## Local Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd bread-mate-2025
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory and populate it with your credentials:

```bash
# Firebase Public Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Brevo (Email Service)
BREVO_KEY=your_brevo_api_key
FROM_EMAIL=sender@example.com
ADMIN_EMAIL=admin@example.com

# (Optional) Genkit / AI Features
GOOGLE_GENAI_API_KEY=your_google_ai_key
```

### 4. Run the development server
```bash
npm run dev
```
The application will be available at `http://localhost:3000` (or `http://localhost:9004` as per some configurations).

## Available Scripts

- `npm run dev`: Starts the Next.js development server.
- `npm run build`: Creates an optimized production build.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint to check for code quality issues.
- `npm run typecheck`: Runs the TypeScript compiler to check for type errors.
- `npm run genkit:dev`: Starts the Genkit development UI for AI flow testing.

## Coding Standards

- **TypeScript**: Always use strict typing. Avoid `any` where possible.
- **UI Components**: Use the existing components in `src/components/ui/` (Shadcn/UI). If you need a new common component, use `npx shadcn-ui@latest add [component-name]`.
- **Styling**: Use Tailwind CSS utility classes. Avoid inline styles or custom CSS unless absolutely necessary (use `globals.css` for global changes).
- **Icons**: Use `lucide-react` for consistent iconography.
- **State**: Use the appropriate React Context in `src/contexts/` for global state (Auth, Cart).

## Contribution Workflow

1. Create a new branch for your feature or bugfix: `git checkout -b feature/your-feature-name`.
2. Make your changes and ensure they pass linting and type checking.
3. Commit your changes with descriptive messages.
4. Push to your branch and create a Pull Request.
