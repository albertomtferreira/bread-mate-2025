import { db } from './firebase';
import { collection, getDocs, doc, setDoc, FieldValue } from 'firebase/firestore';
import type { Order } from '@/types';

/**
 * Utility function to sync customer metrics (CLV, order counts, etc.) from historical orders.
 * This should be run once to initialize metrics for existing users.
 */
export const syncCustomerMetrics = async () => {
    try {
        console.log('Starting customer metrics sync...');
        const ordersCollection = collection(db, 'orders');
        const ordersSnapshot = await getDocs(ordersCollection);
        
        const userMetrics: Record<string, {
            totalSpent: number;
            orderCount: number;
            firstOrderAt?: any;
            lastOrderAt?: any;
        }> = {};

        // 1. Aggregate metrics from all orders
        ordersSnapshot.docs.forEach(orderDoc => {
            const orderData = orderDoc.data() as Order;
            const userId = orderData.userId;
            if (!userId) return; // Skip guest orders for explicit user profile sync

            if (!userMetrics[userId]) {
                userMetrics[userId] = {
                    totalSpent: 0,
                    orderCount: 0,
                    firstOrderAt: orderData.createdAt,
                    lastOrderAt: orderData.createdAt
                };
            }

            const metrics = userMetrics[userId];
            metrics.totalSpent += orderData.total || 0;
            metrics.orderCount += 1;

            // Track earliest/latest orders
            if (orderData.createdAt) {
                const orderTime = orderData.createdAt.toMillis();
                if (orderTime < metrics.firstOrderAt.toMillis()) {
                    metrics.firstOrderAt = orderData.createdAt;
                }
                if (orderTime > metrics.lastOrderAt.toMillis()) {
                    metrics.lastOrderAt = orderData.createdAt;
                }
            }
        });

        // 2. Update user documents with aggregated metrics
        const updatePromises = Object.entries(userMetrics).map(([userId, metrics]) => {
            const userRef = doc(db, 'users', userId);
            return setDoc(userRef, metrics, { merge: true });
        });

        await Promise.all(updatePromises);
        console.log('Customer metrics sync completed successfully!');
        return { success: true, userCount: Object.keys(userMetrics).length };
    } catch (error) {
        console.error('Error syncing customer metrics:', error);
        throw error;
    }
};
