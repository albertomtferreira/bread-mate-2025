import { db } from './firebase';
import { collection, getDocs, doc, updateDoc, increment } from 'firebase/firestore';

/**
 * Utility function to sync favorite counts for all products.
 * Scans all users to count their favorites and updates the products collection.
 * This should be run once to initialize favoriteCount for existing data.
 */
export const syncAllFavoriteCounts = async () => {
    try {
        console.log('Starting favorite count sync...');
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        
        const counts: Record<string, number> = {};

        // 1. Count favorites across all users
        usersSnapshot.docs.forEach(userDoc => {
            const userData = userDoc.data();
            const favorites: string[] = userData.favorites || [];
            favorites.forEach(productId => {
                counts[productId] = (counts[productId] || 0) + 1;
            });
        });

        // 2. Update all products with their new counts
        const productsCollection = collection(db, 'products');
        const productsSnapshot = await getDocs(productsCollection);
        
        const updatePromises = productsSnapshot.docs.map(async (productDoc) => {
            const productId = productDoc.id;
            const newCount = counts[productId] || 0;
            const productRef = doc(db, 'products', productId);
            return updateDoc(productRef, {
                favoriteCount: newCount
            });
        });

        await Promise.all(updatePromises);
        console.log('Favorite count sync completed successfully!');
        return { success: true, count: Object.keys(counts).length };
    } catch (error) {
        console.error('Error syncing favorite counts:', error);
        throw error;
    }
};
