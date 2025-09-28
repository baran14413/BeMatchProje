
'use server';
/**
 * @fileOverview A Genkit flow for handling user feedback submission.
 *
 * - submitFeedback - Saves user feedback to the Firestore database.
 * - SubmitFeedbackInput - The input type for the submitFeedback function.
 * - SubmitFeedbackOutput - The return type for the submitFeedback function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

const SubmitFeedbackInputSchema = z.object({
  userId: z.string().describe('The UID of the user submitting feedback.'),
  userName: z.string().describe("The name of the user."),
  userAvatar: z.string().url().describe("The avatar URL of the user."),
  rating: z.number().min(1).max(5).describe('The star rating provided by the user.'),
  comment: z.string().optional().describe('The text comment provided by the user.'),
});
export type SubmitFeedbackInput = z.infer<typeof SubmitFeedbackInputSchema>;

const SubmitFeedbackOutputSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});
export type SubmitFeedbackOutput = z.infer<typeof SubmitFeedbackOutputSchema>;

export async function submitFeedback(input: SubmitFeedbackInput): Promise<SubmitFeedbackOutput> {
    return submitFeedbackFlow(input);
}

const submitFeedbackFlow = ai.defineFlow(
  {
    name: 'submitFeedbackFlow',
    inputSchema: SubmitFeedbackInputSchema,
    outputSchema: SubmitFeedbackOutputSchema,
  },
  async (input) => {
    if (!getApps().length) {
        initializeApp();
    }
    const db = getFirestore();

    try {
      await db.collection('feedback').add({
        user: {
          uid: input.userId,
          name: input.userName,
          avatarUrl: input.userAvatar,
        },
        rating: input.rating,
        comment: input.comment || '',
        createdAt: Timestamp.now(),
      });
      return { success: true };
    } catch (error: any) {
      console.error(`Failed to submit feedback for user ${input.userId}:`, error);
      return { success: false, error: `Geri bildirim gönderilemedi: ${error.message}` };
    }
  }
);
