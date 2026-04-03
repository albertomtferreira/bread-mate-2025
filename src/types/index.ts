'use client';

import { Timestamp } from 'firebase/firestore';

export interface NutritionalInfo {
  energy?: number;
  fat?: number;
  saturates?: number;
  carbohydrates?: number;
  sugars?: number;
  fibre?: number;
  protein?: number;
  salt?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  alt: string;
  hint: string;
  allergens?: string[];
  isAvailable: boolean;
  ingredients?: string;
  nutritionalInfo?: NutritionalInfo;
  favoriteCount?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
    id: string;
    userId?: string;
    customerName: string;
    customerEmail: string;
    items: CartItem[];
    total: number;
    deliveryAddress: {
        addressLine1: string;
        addressLine2?: string;
        city: string;
        postcode: string;
    };
    status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
    createdAt: Timestamp;
    shippedAt?: Timestamp;
    deliveredAt?: Timestamp;
    trackingProvider?: string;
    trackingNumber?: string;
    trackingUrl?: string; // Add the tracking URL from the courier
}
