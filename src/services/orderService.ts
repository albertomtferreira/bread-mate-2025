'use client';

import type { CartItem, Order } from '@/types';
import { getCloudFunction } from '@/lib/firebase';

interface OrderPayload {
    userId?: string;
    customerName: string;
    customerEmail: string;
    items: CartItem[];
    total: number;
    // Billing Address
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postcode: string;
    // Optional Delivery Address
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


const createOrderFunction = getCloudFunction('createOrder');
const updateOrderStatusFunction = getCloudFunction('updateOrderStatus');

export const createOrder = async (payload: OrderPayload): Promise<string | null> => {
    try {
        if (!payload.items || payload.items.length === 0) {
            throw new Error('Order must contain at least one item');
        }

        if (!payload.customerName || !payload.customerEmail) {
            throw new Error('Customer name and email are required');
        }

        const result: any = await createOrderFunction(payload);
        
        const orderId = result?.data?.orderId;
        
        if (orderId) {
            return orderId;
        } else {
            console.warn('⚠️ Function succeeded but no orderId found in response', result);
            throw new Error('Order was processed but no order ID was returned');
        }

    } catch (error: any) {
        console.error("❌ Error calling createOrder function:", error);
        throw error; // Re-throw to be handled by the UI
    }
}

export const updateOrderStatus = async (payload: UpdateOrderStatusPayload): Promise<{success: boolean, message: string}> => {
    try {
        const result: any = await updateOrderStatusFunction(payload);
        return result.data;
    } catch (error: any) {
        console.error("Error calling updateOrderStatus function:", error);
        throw error; // Re-throw for UI to handle
    }
}
