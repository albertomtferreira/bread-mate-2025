'use client';

import type { CartItem, Order } from '@/types';
import { auth } from '@/lib/firebase';

interface OrderPayload {
    userId?: string;
    customerName: string;
    customerEmail: string;
    items: CartItem[];
    total: number;
    // Billing Address
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    postcode?: string;
    // Optional Delivery Address
    deliveryAddress?: {
        addressLine1: string;
        addressLine2?: string;
        city: string;
        postcode: string;
    };
    deliveryAddressLine1?: string;
    deliveryAddressLine2?: string;
    deliveryCity?: string;
    deliveryPostcode?: string;
    subscribeToNewsletter?: boolean;
}

interface UpdateOrderStatusPayload {
    order: Order;
    status: Order['status'];
    trackingDetails?: {
        trackingProvider: string;
        trackingUrl: string;
        trackingNumber: string;
    }
}


export const createOrder = async (payload: OrderPayload): Promise<string | null> => {
    try {
        if (!payload.items || payload.items.length === 0) {
            throw new Error('Order must contain at least one item');
        }

        if (!payload.customerName || !payload.customerEmail) {
            throw new Error('Customer name and email are required');
        }
        
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to create order');
        }
        
        const orderId = result?.orderId;
        
        if (orderId) {
            return orderId;
        } else {
            console.warn('⚠️ (orderService) API succeeded but no orderId found in response', result);
            throw new Error('Order was processed but no order ID was returned');
        }

    } catch (error: any) {
        console.error("❌ (orderService) Error calling createOrder API:", error);
        throw error; // Re-throw to be handled by the UI
    }
}

export const updateOrderStatus = async (payload: UpdateOrderStatusPayload): Promise<{success: boolean, message: string}> => {
    try {
        const token = await auth.currentUser?.getIdToken();
        const response = await fetch('/api/orders/updateStatus', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Failed to update order status');
        }
        return result;

    } catch (error: any) {
        console.error("Error calling updateOrderStatus API:", error);
        throw error; // Re-throw for UI to handle
    }
}
