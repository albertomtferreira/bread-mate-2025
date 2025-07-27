'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthProvider';

interface NotificationContextType {
  newMessageCount: number;
  newOrderCount: number;
  totalNotifications: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [newOrderCount, setNewOrderCount] = useState(0);

  useEffect(() => {
    let unsubscribeMessages: () => void = () => {};
    let unsubscribeOrders: () => void = () => {};

    // Only set up listeners if the user is an admin
    if (user?.isAdmin) {
      // Listener for new contact messages
      const messagesQuery = query(collection(db, 'contacts'), where('status', '==', 'new'));
      unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
        setNewMessageCount(snapshot.size);
      }, (error) => {
        console.error("Error fetching new messages count:", error);
      });

      // Listener for new orders
      const ordersQuery = query(collection(db, 'orders'), where('status', '==', 'Processing'));
      unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
        setNewOrderCount(snapshot.size);
      }, (error) => {
        console.error("Error fetching new orders count:", error);
      });

    } else {
        // If user is not admin or logs out, reset counts
        setNewMessageCount(0);
        setNewOrderCount(0);
    }

    // Cleanup function to unsubscribe from listeners when the component unmounts or the user changes
    return () => {
      unsubscribeMessages();
      unsubscribeOrders();
    };
  }, [user]); // Rerun effect when user object changes

  const totalNotifications = newMessageCount + newOrderCount;

  const value = {
    newMessageCount,
    newOrderCount,
    totalNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
