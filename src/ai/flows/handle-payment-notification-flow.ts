
'use server';
/**
 * @fileOverview A Genkit flow for handling user payment notifications.
 *
 * - handlePaymentNotification - Saves a user's claim of payment to Firestore for admin review.
 * - PaymentNotificationInput - The input type for the function.
 * - PaymentNotificationOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, serverTimestamp, addDoc, collection } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

const PaymentNotificationInputSchema = z.object({
  userId: z.string().describe('The UID of the user submitting the notification.'),
  userName: z.string().describe("The name of the user."),
  userEmail: z.string().email().describe("The email of the user."),
  packageName: z.string().describe('The name of the package the user claims to have bought.'),
  packagePrice: z.string().describe('The price of the package.'),
});
export type PaymentNotificationInput = z.infer<typeof PaymentNotificationInputSchema>;

const PaymentNotificationOutputSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});
export type PaymentNotificationOutput = z.infer<typeof PaymentNotificationOutputSchema>;

export async function handlePaymentNotification(input: PaymentNotificationInput): Promise<PaymentNotificationOutput> {
    return handlePaymentNotificationFlow(input);
}

const handlePaymentNotificationFlow = ai.defineFlow(
  {
    name: 'handlePaymentNotificationFlow',
    inputSchema: PaymentNotificationInputSchema,
    outputSchema: PaymentNotificationOutputSchema,
  },
  async (input) => {
    if (!getApps().length) {
        initializeApp();
    }
    const db = getFirestore();

    try {
      await addDoc(collection(db, 'paymentNotifications'), {
        userId: input.userId,
        userName: input.userName,
        userEmail: input.userEmail,
        packageName: input.packageName,
        packagePrice: input.packagePrice,
        isCompleted: false, // Admin needs to manually verify and mark as complete
        createdAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error: any) {
      console.error(`Failed to handle payment notification for user ${input.userId}:`, error);
      return { success: false, error: `Bildirim gönderilemedi: ${error.message}` };
    }
  }
);
