
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
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { botReplies } from '@/config/bot-config';
import { auth as clientAuth, db as clientDb } from '@/lib/firebase'; // Assuming you have client instances exported

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
    const currentUserId = clientAuth.currentUser?.uid;

    if (!currentUserId) {
         return { success: false, error: 'User not authenticated.' };
    }

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

        // Dynamically find the bot's ID
        const botUser = conversation.user1.uid.startsWith('bot_') 
            ? conversation.user1 
            : conversation.user2.uid.startsWith('bot_') 
            ? conversation.user2 
            : null;

        if (!botUser) {
            return { success: false, error: 'This is not a bot conversation.' };
        }

        const botId = botUser.uid;

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
