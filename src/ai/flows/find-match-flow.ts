
'use server';
/**
 * @fileOverview A Genkit flow for matching users for a random chat.
 *
 * This flow provides a robust, transaction-based matchmaking system.
 * - findMatch: Tries to find a waiting user. If none, adds the user to the pool and waits.
 *              If no match is found within a timeout, it creates a bot match.
 */

import { z } from 'zod';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { botNames, botOpenerMessages } from '@/config/bot-config';

const FindMatchInputSchema = z.object({
  userId: z.string().describe('The UID of the user searching for a match.'),
});
export type FindMatchInput = z.infer<typeof FindMatchInputSchema>;

const FindMatchOutputSchema = z.object({
  conversationId: z.string().nullable().describe('The ID of the conversation, or null if no match was found yet.'),
  isBotMatch: z.boolean().describe('Whether the match is with a bot.'),
});
export type FindMatchOutput = z.infer<typeof FindMatchOutputSchema>;

if (!getApps().length) {
    initializeApp();
}
const db = getFirestore();
const MATCH_TIMEOUT = 15000; // 15 seconds

async function createBotMatch(userId: string): Promise<FindMatchOutput> {
    const userDocRef = db.doc(`users/${userId}`);
    const userDocSnap = await userDocRef.get();
    if (!userDocSnap.exists) throw new Error("Current user not found in database for bot match.");

    const currentUserData = userDocSnap.data()!;
    const botId = `bot_${Math.random().toString(36).substring(2, 9)}`;
    const botName = botNames[Math.floor(Math.random() * botNames.length)];
    const botAvatar = `https://avatar.iran.liara.run/public/girl?username=${botName.replace(/\s/g, '')}`;
    
    const botConvoId = [userId, botId].sort().join('-');
    const botConvoRef = db.collection('temporaryConversations').doc(botConvoId);
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 3);

    await botConvoRef.set({
        user1: { uid: currentUserData.uid, name: currentUserData.name, avatarUrl: currentUserData.avatarUrl, heartClicked: false },
        user2: { uid: botId, name: botName, avatarUrl: botAvatar, heartClicked: false },
        isBotMatch: true,
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(expiresAt),
    });
    
    // Add bot's opener message
    await botConvoRef.collection('messages').add({
        text: botOpenerMessages[Math.floor(Math.random() * botOpenerMessages.length)],
        senderId: botId,
        timestamp: Timestamp.now()
    });

    return { conversationId: botConvoId, isBotMatch: true };
}


export async function findMatch(input: FindMatchInput): Promise<FindMatchOutput> {
    const { userId } = input;
    const waitingPoolCollection = db.collection('waitingPool');

    try {
        // Transaction 1: Try to find a match immediately.
        const immediateMatchResult = await db.runTransaction(async (transaction) => {
            const waitingQuery = waitingPoolCollection
                .where('uid', '!=', userId)
                .orderBy('uid')
                .orderBy('waitingSince', 'asc')
                .limit(1);
            
            const waitingSnapshot = await transaction.get(waitingQuery);

            if (waitingSnapshot.empty) {
                // No one is waiting. Add current user to pool.
                const userDoc = await transaction.get(db.doc(`users/${userId}`));
                if (!userDoc.exists) throw new Error("User document does not exist.");
                
                transaction.set(waitingPoolCollection.doc(userId), {
                    uid: userId,
                    name: userDoc.data()!.name,
                    avatarUrl: userDoc.data()!.avatarUrl,
                    waitingSince: Timestamp.now(),
                });
                return null; // Return null to indicate user is now waiting
            }
            
            // Found a waiting user. Create a real match.
            const waitingUserDoc = waitingSnapshot.docs[0];
            const waitingUserData = waitingUserDoc.data();
            const currentUserDoc = await transaction.get(db.doc(`users/${userId}`));
            if (!currentUserDoc.exists) throw new Error("Current user not found.");
            const currentUserData = currentUserDoc.data()!;

            const newConvoRef = db.collection('temporaryConversations').doc();
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 3);

            transaction.set(newConvoRef, {
                user1: { uid: waitingUserData.uid, name: waitingUserData.name, avatarUrl: waitingUserData.avatarUrl, heartClicked: false },
                user2: { uid: currentUserData.uid, name: currentUserData.name, avatarUrl: currentUserData.avatarUrl, heartClicked: false },
                isBotMatch: false,
                createdAt: Timestamp.now(),
                expiresAt: Timestamp.fromDate(expiresAt),
            });
            
            // Remove the matched user from the pool
            transaction.delete(waitingUserDoc.ref);

            return { conversationId: newConvoRef.id, isBotMatch: false };
        });

        if (immediateMatchResult) {
            return immediateMatchResult;
        }

        // If no immediate match, wait for the timeout.
        await new Promise(resolve => setTimeout(resolve, MATCH_TIMEOUT));

        // Transaction 2: After timeout, check if we were matched. If not, create a bot match.
        const userInPoolRef = waitingPoolCollection.doc(userId);
        const userInPoolSnap = await userInPoolRef.get();

        if (!userInPoolSnap.exists()) {
            // We were matched by someone else during the wait. We need to find that conversation.
            const q = db.collection('temporaryConversations')
                .where('users', 'array-contains', userId)
                .orderBy('createdAt', 'desc')
                .limit(1);

            const convoSnapshot = await q.get();
            if (!convoSnapshot.empty) {
                return { conversationId: convoSnapshot.docs[0].id, isBotMatch: false };
            } else {
                // This is an edge case, something went wrong. Create a bot match as a fallback.
                 await userInPoolRef.delete().catch(() => {});
                 return createBotMatch(userId);
            }
        }
        
        // Still in the pool, nobody matched us. Create a bot match.
        await userInPoolRef.delete();
        return createBotMatch(userId);

    } catch (error: any) {
        console.error('Matchmaking flow failed:', error);
        // Clean up user from pool just in case.
        await waitingPoolCollection.doc(userId).delete().catch(() => {});
        // As a last resort, give them a bot match instead of an error.
        return createBotMatch(userId);
    }
}
