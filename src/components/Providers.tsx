'use client';

import { AuthProvider } from '@/contexts/AuthProvider';
import { CartProvider } from '@/contexts/CartProvider';
import { NotificationProvider } from '@/contexts/NotificationProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <CartProvider>{children}</CartProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
