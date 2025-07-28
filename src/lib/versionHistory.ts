'use client';

export interface Version {
  version: string;
  date: string;
  changes: string[];
}

export const versionHistory: Version[] = [
  {
    version: 'v1.9',
    date: '31-07-2025',
    changes: [
      'Created a new Content Management section in the admin dashboard.',
      'Enabled real-time editing of website text (e.g., product and gallery titles).',
      'Added a controllable top-line promotional text banner.',
      'Added a controllable homepage promotional image banner.',
    ],
  },
  {
    version: 'v1.8',
    date: '30-07-2025',
    changes: [
      'Reordered Account Page layout to prioritize user details.',
      'Enhanced "My Favorites" with last purchased date and add-to-cart functionality.',
      'Replaced product detail dialog with a slide-in sheet for a better UX.',
    ],
  },
  {
    version: 'v1.7',
    date: '29-07-2025',
    changes: [
      'Implemented "Favorite Items" feature for logged-in users.',
      'Added a favorites section to the user account page.',
      'Guests are prompted to sign in to use the feature.',
    ],
  },
  {
    version: 'v1.6',
    date: '28-07-2025',
    changes: [
      'Added nutritional information display on product cards.',
      'Implemented a detailed nutritional information dialog.',
      'Enhanced admin product forms to include nutritional data.',
      'Added version history log and dialog.',
    ],
  },
  {
    version: 'v1.5',
    date: '25-07-2025',
    changes: [
      'Implemented interactive "Add to Cart" button with quantity stepper.',
      'Created a comprehensive project roadmap.',
      'Added version number to the footer.',
    ],
  },
  {
    version: 'v1.0',
    date: '24-07-2025',
    changes: [
      'Initial release with core e-commerce functionality.',
      'User authentication (Email/Password, Google Sign-In).',
      'Admin dashboard for managing products, orders, and content.',
      'Guest checkout and order placement.',
      'Real-time notifications for admins.',
    ],
  },
];
