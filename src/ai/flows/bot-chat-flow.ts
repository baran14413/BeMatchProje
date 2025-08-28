
'use server';
/**
 * @fileOverview A flow for handling bot responses in random chats without AI.
 *
 * - botChatFlow - Generates a bot response from a predefined list and adds it to the conversation.
 * - BotChatInput - The input type for the botChatFlow function.
 * - BotChatOutput - The return type for the botChatFlow function.
 */

import { z } from 'zod';
import { getFirestore, serverTimestamp, addDoc, collection, doc, getDoc } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { botReplies } from '@/config/bot-config';

// This is not a Genkit flow anymore, just a standard server action.

const BotChatInputSchema = z.object({
  conversationId: z.string().describe('The ID of the temporary conversation.'),
});
export type BotChatInput = z.infer<typeof BotChatInputSchema>;

const BotChatOutputSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});
export type BotChatOutput = z.infer<typeof BotChatOutputSchema>;


export async function botChatFlow(input: BotChatInput): Promise<BotChatOutput> {
    const parsedInput = BotChatInputSchema.safeParse(input);
    if (!parsedInput.success) {
        return { success: false, error: 'Invalid input.' };
    }
    
    const { conversationId } = parsedInput.data;

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
        // Assuming bot is always user2 in bot matches
        const botId = conversation?.user2.uid; 

        if (!botId || !botId.startsWith('bot_')) {
            return { success: false, error: 'This is not a bot conversation.' };
        }

        // Simple logic to select a random reply from the config
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
