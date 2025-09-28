
'use server';
/**
 * @fileOverview A flow for handling bot responses in random chats without AI.
 *
 * - botChatFlow - Generates a bot response from a predefined list and adds it to the conversation.
 * - BotChatInput - The input type for the botChatFlow function.
 * - BotChatOutput - The return type for the botChatFlow function.
 */

import { z } from 'zod';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { botReplies } from '@/config/bot-config';

const BotChatInputSchema = z.object({
  conversationId: z.string().describe('The ID of the temporary conversation.'),
  currentUserId: z.string().describe('The ID of the human user in the conversation.')
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
    
    const { conversationId, currentUserId } = parsedInput.data;

    if (!getApps().length) {
        initializeApp();
    }
    const db = getFirestore();

    try {
        const convoRef = db.collection('temporaryConversations').doc(conversationId);
        const convoSnap = await convoRef.get();

        if (!convoSnap.exists) {
            return { success: false, error: 'Conversation not found.' };
        }

        const conversation = convoSnap.data()!;
        const usersInConvo = [conversation.user1.uid, conversation.user2.uid];
        
        // Find the bot's ID by finding the user that is NOT the current user
        const botId = usersInConvo.find(uid => uid !== currentUserId && uid.startsWith('bot_'));

        if (!botId) {
            // This could happen if the conversation is with a real user, which is fine.
            return { success: false, error: 'This is not a bot conversation or bot could not be identified.' };
        }

        // Simple logic to select a random reply from the config
        const reply = botReplies[Math.floor(Math.random() * botReplies.length)];

        // Add bot's message to the subcollection
        const messagesRef = convoRef.collection('messages');
        await messagesRef.add({
            text: reply,
            senderId: botId,
            timestamp: Timestamp.now(),
        });
        
        return { success: true };
    } catch (error: any) {
        console.error(`Bot chat flow failed for convo ${conversationId}:`, error);
        return { success: false, error: `Bot response failed: ${error.message}` };
    }
}
