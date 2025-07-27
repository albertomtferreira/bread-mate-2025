'use client';

import { db } from '@/lib/firebase';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { getCloudFunction } from '@/lib/firebase';

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

const setUserAdminStatusFunction = getCloudFunction('setUserAdminStatus');

/**
 * Sets a user's admin status. This must be called by an authenticated admin user.
 * @param uid The UID of the user to modify.
 * @param isAdmin The new admin status.
 */
export const setUserAdminStatus = async (uid: string, isAdmin: boolean): Promise<any> => {
    try {
        const result = await setUserAdminStatusFunction({ uid, isAdmin });
        return result.data;
    } catch (error) {
        console.error("Error setting user admin status:", error);
        // Re-throw the error so the calling component can handle it by displaying a toast
        throw error;
    }
};
