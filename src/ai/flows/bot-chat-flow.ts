
'use server';
/**
 * @fileOverview A Genkit flow for handling bot responses in random chats.
 *
 * - botChatFlow - Generates a bot response and adds it to the conversation.
 * - BotChatInput - The input type for the botChatFlow function.
 * - BotChatOutput - The return type for the botChatFlow function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, serverTimestamp, addDoc, collection, doc } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { botNames, botReplies } from '@/config/bot-config';

const BotChatInputSchema = z.object({
  conversationId: z.string().describe('The ID of the temporary conversation.'),
  userMessage: z.string().describe('The message sent by the real user.'),
});
export type BotChatInput = z.infer<typeof BotChatInputSchema>;

const BotChatOutputSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});
export type BotChatOutput = z.infer<typeof BotChatOutputSchema>;


export const botChatFlow = ai.defineFlow(
  {
    name: 'botChatFlow',
    inputSchema: BotChatInputSchema,
    outputSchema: BotChatOutputSchema,
  },
  async ({ conversationId, userMessage }) => {
    if (!getApps().length) {
        initializeApp();
    }
    const db = getFirestore();

    try {
        const convoRef = doc(db, 'temporaryConversations', conversationId);
        const convoSnap = await getDoc(convoRef);

        if (!convoSnap.exists()) {
            return { success: false, error: 'Conversation not found.' };
        }

        const conversation = convoSnap.data();
        const botId = conversation?.user2.uid; // Assuming bot is always user2

        if (!botId || !botId.startsWith('bot_')) {
            return { success: false, error: 'This is not a bot conversation.' };
        }

        // Simple logic to select a reply
        const reply = botReplies[Math.floor(Math.random() * botReplies.length)];

        // Add bot's message to the subcollection
        const messagesRef = collection(convoRef, 'messages');
        await addDoc(messagesRef, {
            text: reply,
            senderId: botId,
            timestamp: serverTimestamp(),
        });
        
        return { success: true };
    } catch (error: any) {
        console.error(`Bot chat flow failed for convo ${conversationId}:`, error);
        return { success: false, error: `Bot response failed: ${error.message}` };
    }
  }
);
