
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
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';
import { initializeApp, getApps } from 'firebase-admin/app';


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
    if (!getApps().length) {
        initializeApp();
    }
    const db = getFirestore();
    const storage = getAdminStorage().bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    
    try {
      const mimeType = input.photoDataUri.match(/data:(.*);base64,/)?.[1] || 'image/jpeg';
      const fileExtension = mimeType.split('/')[1] || 'jpg';
      const buffer = Buffer.from(input.photoDataUri.split('base64,')[1], 'base64');
      const fileName = `suspicious-logins/${Date.now()}.${fileExtension}`;
      const file = storage.file(fileName);

      await file.save(buffer, {
          metadata: { contentType: mimeType },
      });
      const [photoUrl] = await file.getSignedUrl({
          action: 'read',
          expires: '03-09-2491', // A long expiry date
      });

      // 2. Log the activity to Firestore
      await db.collection('suspicious-logins').add({
        attemptedPin: input.attemptedPin,
        attemptedKey: input.attemptedKey,
        photoUrl: photoUrl,
        timestamp: Timestamp.now(),
      });

      return { success: true };
    } catch (error: any) {
      console.error(`Failed to log suspicious activity:`, error);
      return { success: false, error: `Suspicious activity could not be logged: ${error.message}` };
    }
  }
);
