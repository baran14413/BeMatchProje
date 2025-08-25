
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
import { getFirestore } from 'firebase-admin/firestore';
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


const deleteUserDataFlow = ai.defineFlow(
  {
    name: 'deleteUserDataFlow',
    inputSchema: DeleteUserDataInputSchema,
    outputSchema: DeleteUserDataOutputSchema,
  },
  async ({ userId }) => {
    
    // Initialize Firebase Admin SDK if not already initialized
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

        // 1. Delete user's posts and associated storage files
        const postsQuery = db.collection('posts').where('authorId', '==', userId);
        const postsSnapshot = await postsQuery.get();
        for (const postDoc of postsSnapshot.docs) {
            const postData = postDoc.data();
            if (postData.type === 'photo' && postData.url) {
                try {
                    const fileUrl = new URL(postData.url);
                    const filePath = decodeURIComponent(fileUrl.pathname.split('/o/')[1]);
                    const fileRef = storage.bucket().file(filePath);
                    await fileRef.delete();
                } catch (error: any) {
                    // It's okay if the file doesn't exist (e.g. already deleted, or bad URL)
                    if (error.code !== 404) { // GCS not found code
                        console.warn(`Could not delete storage file for post ${postDoc.id}:`, error);
                    }
                }
            }
             // Delete subcollections like comments and likes (if they exist)
            const commentsRef = db.collection('posts').doc(postDoc.id).collection('comments');
            const likesRef = db.collection('posts').doc(postDoc.id).collection('likes');
            const commentsSnapshot = await commentsRef.get();
            const likesSnapshot = await likesRef.get();
            commentsSnapshot.forEach(doc => batch.delete(doc.ref));
            likesSnapshot.forEach(doc => batch.delete(doc.ref));

            batch.delete(postDoc.ref);
        }

        // 2. Delete user's conversations
        const conversationsQuery = db.collection('conversations').where('users', 'array-contains', userId);
        const conversationsSnapshot = await conversationsQuery.get();
        for (const convoDoc of conversationsSnapshot.docs) {
            // Delete all messages in the conversation's subcollection
            const messagesRef = db.collection('conversations').doc(convoDoc.id).collection('messages');
            const messagesSnapshot = await messagesRef.get();
            messagesSnapshot.forEach(messageDoc => {
                batch.delete(messageDoc.ref);
            });
            // Delete the conversation document itself
            batch.delete(convoDoc.ref);
        }
        
        // 3. Delete the user document from Firestore and its subcollections
        const userDocRef = db.collection('users').doc(userId);
        
        // Delete user's own subcollections
        const followersRef = userDocRef.collection('followers');
        const followingRef = userDocRef.collection('following');
        const galleryPermsRef = userDocRef.collection('galleryPermissions');
        
        const [followersSnap, followingSnap, galleryPermsSnap] = await Promise.all([
            followersRef.get(),
            followingRef.get(),
            galleryPermsRef.get()
        ]);

        followersSnap.forEach(doc => batch.delete(doc.ref));
        followingSnap.forEach(doc => batch.delete(doc.ref));
        galleryPermsSnap.forEach(doc => batch.delete(doc.ref));
        
        // Finally, delete the user document itself
        batch.delete(userDocRef);

        // Commit all batched Firestore deletions
        await batch.commit();

        // 4. Delete the user from Firebase Authentication
        await auth.deleteUser(userId);

        return { success: true };
    } catch (error: any) {
        console.error(`Failed to delete user ${userId}:`, error);
        return { success: false, error: `Hesap silinirken bir hata oluştu: ${error.message}` };
    }
  }
);
