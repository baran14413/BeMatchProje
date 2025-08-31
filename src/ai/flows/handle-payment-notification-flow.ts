
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
import { getStorage } from 'firebase-admin/storage';
import { initializeApp, getApps } from 'firebase-admin/app';


const PaymentNotificationInputSchema = z.object({
  userId: z.string().describe('The UID of the user submitting the notification.'),
  userName: z.string().describe("The name of the user."),
  userEmail: z.string().email().describe("The email of the user."),
  packageName: z.string().describe('The name of the package the user claims to have bought.'),
  packagePrice: z.string().describe('The price of the package.'),
   receiptDataUri: z.string().optional().describe(
      "A photo of the payment receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
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
    const storage = getStorage().bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);

    try {
      let receiptUrl = '';
      if (input.receiptDataUri) {
          const mimeType = input.receiptDataUri.match(/data:(.*);base64,/)?.[1] || 'image/jpeg';
          const fileExtension = mimeType.split('/')[1] || 'jpg';
          const buffer = Buffer.from(input.receiptDataUri.split('base64,')[1], 'base64');
          const fileName = `receipts/${input.userId}/${Date.now()}.${fileExtension}`;
          const file = storage.file(fileName);

          await file.save(buffer, {
              metadata: {
                  contentType: mimeType,
              },
          });
          receiptUrl = await file.getSignedUrl({
              action: 'read',
              expires: '03-09-2491' 
          }).then(urls => urls[0]);
      }
        
      await addDoc(collection(db, 'paymentNotifications'), {
        userId: input.userId,
        userName: input.userName,
        userEmail: input.userEmail,
        packageName: input.packageName,
        packagePrice: input.packagePrice,
        receiptUrl: receiptUrl,
        isCompleted: false, 
        createdAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error: any) {
      console.error(`Failed to handle payment notification for user ${input.userId}:`, error);
      return { success: false, error: `Bildirim gönderilemedi: ${error.message}` };
    }
  }
);
