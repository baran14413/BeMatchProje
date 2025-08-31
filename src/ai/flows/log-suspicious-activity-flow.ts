
'use server';
/**
 * @fileOverview A Genkit flow for logging suspicious login attempts to the admin panel.
 *
 * - logSuspiciousActivity - Logs the attempt with details and a face capture image.
 * - LogSuspiciousActivityInput - The input type for the function.
 * - LogSuspiciousActivityOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, serverTimestamp, addDoc, collection } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';
import { auth as clientAuth } from '@/lib/firebase'; // Use client auth for this flow's storage part

const LogSuspiciousActivityInputSchema = z.object({
  attemptedPin: z.string().describe('The PIN that was entered.'),
  attemptedKey: z.string().describe('The security key that was entered.'),
  photoDataUri: z
    .string()
    .describe(
      "A photo of the user, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type LogSuspiciousActivityInput = z.infer<typeof LogSuspiciousActivityInputSchema>;

const LogSuspiciousActivityOutputSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});
export type LogSuspiciousActivityOutput = z.infer<typeof LogSuspiciousActivityOutputSchema>;

export async function logSuspiciousActivity(input: LogSuspiciousActivityInput): Promise<LogSuspiciousActivityOutput> {
    return logSuspiciousActivityFlow(input);
}

const logSuspiciousActivityFlow = ai.defineFlow(
  {
    name: 'logSuspiciousActivityFlow',
    inputSchema: LogSuspiciousActivityInputSchema,
    outputSchema: LogSuspiciousActivityOutputSchema,
  },
  async (input) => {
    // Admin SDK for Firestore
    if (!getApps().length) {
        initializeApp();
    }
    const db = getFirestore();
    // Client SDK for Storage to upload the image
    const storage = getStorage(clientAuth.app);
    
    try {
      // 1. Upload the captured photo to Firebase Storage
      const storageRef = ref(storage, `suspicious-logins/${Date.now()}.jpg`);
      await uploadString(storageRef, input.photoDataUri, 'data_url');
      const photoUrl = await getDownloadURL(storageRef);

      // 2. Log the activity to Firestore
      await addDoc(collection(db, 'suspicious-logins'), {
        attemptedPin: input.attemptedPin,
        attemptedKey: input.attemptedKey,
        photoUrl: photoUrl,
        timestamp: serverTimestamp(),
      });

      return { success: true };
    } catch (error: any) {
      console.error(`Failed to log suspicious activity:`, error);
      return { success: false, error: `Suspicious activity could not be logged: ${error.message}` };
    }
  }
);
