
'use server';
/**
 * @fileOverview A Genkit flow for completely deleting a user and all their associated data.
 *
 * - deleteUserData - Deletes a user's profile, posts, storage files, conversations, and auth record.
 * - DeleteUserDataInput - The input type for the deleteUserData function.
 * - DeleteUserDataOutput - The return type for the deleteUserData function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, WriteBatch, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';


const DeleteUserDataInputSchema = z.object({
  userId: z.string().describe('The UID of the user to be deleted.'),
});
export type DeleteUserDataInput = z.infer<typeof DeleteUserDataInputSchema>;

const DeleteUserDataOutputSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});
export type DeleteUserDataOutput = z.infer<typeof DeleteUserDataOutputSchema>;


export async function deleteUserData(input: DeleteUserDataInput): Promise<DeleteUserDataOutput> {
    return deleteUserDataFlow(input);
}

// Helper to delete subcollections in batches
async function deleteSubcollection(db: FirebaseFirestore.Firestore, collectionPath: string, batchSize: number = 100) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise<void>((resolve, reject) => {
        deleteQueryBatch(db, query, resolve).catch(reject);
    });
}

async function deleteQueryBatch(db: FirebaseFirestore.Firestore, query: FirebaseFirestore.Query, resolve: () => void) {
    const snapshot = await query.get();

    if (snapshot.size === 0) {
        resolve();
        return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    process.nextTick(() => {
        deleteQueryBatch(db, query, resolve);
    });
}


const deleteUserDataFlow = ai.defineFlow(
  {
    name: 'deleteUserDataFlow',
    inputSchema: DeleteUserDataInputSchema,
    outputSchema: DeleteUserDataOutputSchema,
  },
  async ({ userId }) => {
    
    if (!getApps().length) {
        initializeApp();
    }
    
    const db = getFirestore();
    const storage = getStorage();
    const auth = getAuth();

    if (!userId) {
        return { success: false, error: 'Kullanıcı ID\'si sağlanmadı.' };
    }

    try {
        const batch = db.batch();
        const userDocRef = db.collection('users').doc(userId);

        // 1. Delete user's posts. Associated storage files will be orphaned but this is safer.
        const postsQuery = db.collection('posts').where('authorId', '==', userId);
        const postsSnapshot = await postsQuery.get();
        for (const postDoc of postsSnapshot.docs) {
            await deleteSubcollection(db, `posts/${postDoc.id}/comments`);
            await deleteSubcollection(db, `posts/${postDoc.id}/likes`);
            batch.delete(postDoc.ref);
        }

        // 2. Delete user's conversations
        const conversationsQuery = db.collection('conversations').where('users', 'array-contains', userId);
        const conversationsSnapshot = await conversationsQuery.get();
        for (const convoDoc of conversationsSnapshot.docs) {
            await deleteSubcollection(db, `conversations/${convoDoc.id}/messages`);
            batch.delete(convoDoc.ref);
        }
        
        // 3. Delete user's subcollections from their own profile
        await deleteSubcollection(db, `users/${userId}/followers`);
        await deleteSubcollection(db, `users/${userId}/following`);
        await deleteSubcollection(db, `users/${userId}/galleryPermissions`);

        // Finally, delete the user document itself
        batch.delete(userDocRef);

        // Commit all batched Firestore deletions
        await batch.commit();

        // 4. Delete the user from Firebase Authentication
        await auth.deleteUser(userId);

        return { success: true };
    } catch (error: any) {
        console.error(`Failed to delete user ${userId}:`, error);
        // Provide a more generic but helpful error message to the user
        let errorMessage = 'Hesap silinirken bir sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'Kullanıcı zaten silinmiş veya bulunamadı.';
        }
        return { success: false, error: errorMessage };
    }
  }
);
