
'use server';
/**
 * @fileOverview A Genkit flow for logging user activity.
 *
 * - logActivity - Logs user activity with IP and user agent.
 * - LogActivityInput - The input type for the logActivity function.
 * - LogActivityOutput - The return type for the logActivity function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, serverTimestamp, addDoc, collection } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

const LogActivityInputSchema = z.object({
  userId: z.string().describe('The UID of the user.'),
  userName: z.string().describe('The name of the user.'),
  userAvatar: z.string().describe('The avatar URL of the user.'),
  ipAddress: z.string().describe('The IP address of the user.'),
  userAgent: z.string().describe('The user agent string of the user\'s browser.'),
});
export type LogActivityInput = z.infer<typeof LogActivityInputSchema>;

const LogActivityOutputSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});
export type LogActivityOutput = z.infer<typeof LogActivityOutputSchema>;

export async function logActivity(input: LogActivityInput): Promise<LogActivityOutput> {
    return logActivityFlow(input);
}

const logActivityFlow = ai.defineFlow(
  {
    name: 'logActivityFlow',
    inputSchema: LogActivityInputSchema,
    outputSchema: LogActivityOutputSchema,
  },
  async (input) => {
    if (!getApps().length) {
        initializeApp();
    }
    const db = getFirestore();

    try {
        await addDoc(collection(db, 'activityLogs'), {
            user: {
                uid: input.userId,
                name: input.userName,
                avatarUrl: input.userAvatar,
            },
            ipAddress: input.ipAddress,
            userAgent: input.userAgent,
            timestamp: serverTimestamp(),
        });
        return { success: true };
    } catch (error: any) {
        console.error(`Failed to log activity for user ${input.userId}:`, error);
        return { success: false, error: `Activity logging failed: ${error.message}` };
    }
  }
);
