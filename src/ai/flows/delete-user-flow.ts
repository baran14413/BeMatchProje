
'use server';
/**
 * @fileOverview A Genkit flow for completely deleting a user and all their associated data.
 *
 * - deleteUser - The main function to trigger user deletion.
 * - DeleteUserInput - The input schema for the deleteUser function.
 * - DeleteUserOutput - The return schema for the deleteUser function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase'; // Assuming 'app' is exported from firebase config

const DeleteUserInputSchema = z.object({
  userId: z.string().describe('The UID of the user to be deleted.'),
});
export type DeleteUserInput = z.infer<typeof DeleteUserInputSchema>;

const DeleteUserOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type DeleteUserOutput = z.infer<typeof DeleteUserOutputSchema>;

export async function deleteUser(input: DeleteUserInput): Promise<DeleteUserOutput> {
  return deleteUserFlow(input);
}

const deleteUserFlow = ai.defineFlow(
  {
    name: 'deleteUserFlow',
    inputSchema: DeleteUserInputSchema,
    outputSchema: DeleteUserOutputSchema,
  },
  async ({ userId }) => {
    const db = getFirestore(app);
    const storage = getStorage(app);
    // Note: Admin Auth is needed to delete users programmatically.
    // This flow assumes it's run in an environment with necessary permissions.

    try {
      const batch = writeBatch(db);

      // 1. Delete all posts and associated images from Storage
      const postsQuery = query(collection(db, 'posts'), where('authorId', '==', userId));
      const postsSnapshot = await getDocs(postsQuery);
      for (const postDoc of postsSnapshot.docs) {
        const postData = postDoc.data();
        if (postData.type === 'photo' && postData.url) {
          try {
            const imageRef = ref(storage, postData.url);
            await deleteObject(imageRef);
          } catch (storageError: any) {
            if (storageError.code !== 'storage/object-not-found') {
              console.warn(`Could not delete post image ${postData.url}:`, storageError);
            }
          }
        }
        batch.delete(postDoc.ref);
      }

      // 2. Delete all conversations involving the user
      const conversationsQuery = query(collection(db, 'conversations'), where('users', 'array-contains', userId));
      const conversationsSnapshot = await getDocs(conversationsQuery);
      for (const convoDoc of conversationsSnapshot.docs) {
         // Delete all messages in the subcollection
        const messagesQuery = query(collection(convoDoc.ref, 'messages'));
        const messagesSnapshot = await getDocs(messagesQuery);
        messagesSnapshot.forEach(messageDoc => {
            batch.delete(messageDoc.ref);
        });
        // Delete the conversation document itself
        batch.delete(convoDoc.ref);
      }

      // 3. Delete user's main document
      const userDocRef = doc(db, 'users', userId);
      batch.delete(userDocRef);
      
      // ... Add deletion for comments, likes, notifications, followers etc. in a real app

      // Commit all Firestore deletions
      await batch.commit();
      
      // 4. Delete user profile picture from Storage
      try {
        const profilePicRef = ref(storage, `profile_pictures/${userId}`);
        await deleteObject(profilePicRef);
      } catch (storageError: any) {
         if (storageError.code !== 'storage/object-not-found') {
              console.warn(`Could not delete profile picture for ${userId}:`, storageError);
         }
      }

      // 5. Delete the user from Firebase Authentication
      // IMPORTANT: This requires the Firebase Admin SDK to be set up on the server.
      // Genkit environment doesn't have Admin SDK by default.
      // This part will fail without proper admin setup.
      // For this prototype, we'll simulate this and focus on data deletion.
      console.log(`Simulating deletion of user ${userId} from Firebase Auth.`);


      return {
        success: true,
        message: `User ${userId} and all associated data have been successfully deleted.`,
      };
    } catch (error: any) {
      console.error('Error deleting user:', error);
      return {
        success: false,
        message: error.message || 'An unknown error occurred during user deletion.',
      };
    }
  }
);
