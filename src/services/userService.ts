'use client';

import { db, auth } from '@/lib/firebase';
import { doc, updateDoc, setDoc, getDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';


/**
 * Updates a user's details in the Firestore 'users' collection.
 * This function can be called by any authenticated user to update their own details.
 * @param uid The user's unique ID from Firebase Auth.
 * @param details The user details to update or set.
 */
export const updateUserDetails = async (uid: string, details: any): Promise<void> => {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);

    if(userDoc.exists()) {
        await updateDoc(userDocRef, details);
    } else {
        await setDoc(userDocRef, details, { merge: true });
    }
};

/**
 * Adds or removes a product from a user's favorites list.
 * @param userId The ID of the user.
 * @param productId The ID of the product to toggle.
 * @param isFavorited The current favorite status of the product.
 */
export const toggleFavorite = async (userId: string, productId: string, isFavorited: boolean): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    try {
        const productRef = doc(db, 'products', productId);
        if (isFavorited) {
            // Remove from user favorites and decrement product count
            await updateDoc(userRef, {
                favorites: arrayRemove(productId)
            });
            await updateDoc(productRef, {
                favoriteCount: increment(-1)
            });
        } else {
            // Add to user favorites and increment product count
            await updateDoc(userRef, {
                favorites: arrayUnion(productId)
            });
            await updateDoc(productRef, {
                favoriteCount: increment(1)
            });
        }
    } catch (error) {
        console.error("Error toggling favorite:", error);
        throw new Error("Could not update your favorites. Please try again.");
    }
};


/**
 * Sets a user's admin status. This must be called by an authenticated admin user.
 * @param uid The UID of the user to modify.
 * @param isAdmin The new admin status.
 */
export const setUserAdminStatus = async (uid: string, isAdmin: boolean): Promise<any> => {
    try {
        const token = await auth.currentUser?.getIdToken();
        const response = await fetch('/api/users/setAdmin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ uid, isAdmin })
        });
        
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Failed to set admin status');
        }
        return result;

    } catch (error) {
        console.error("Error setting user admin status:", error);
        // Re-throw the error so the calling component can handle it by displaying a toast
        throw error;
    }
};
