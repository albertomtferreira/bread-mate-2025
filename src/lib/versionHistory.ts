'use client';

export interface Version {
  version: string;
  date: string;
  changes: string[];
}

export const versionHistory: Version[] = [
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
