
'use server';
/**
 * @fileOverview A Genkit flow for matching users for a random chat.
 *
 * This flow provides a robust, transaction-based matchmaking system.
 * - findMatch: Tries to find a waiting user. If none, adds the user to the pool and waits.
 *              If no match is found within a timeout, it creates a bot match.
 */

import { z } from 'zod';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
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
const MATCH_TIMEOUT_SECONDS = 15;

async function createBotMatch(userId: string): Promise<FindMatchOutput> {
    const userDocRef = db.doc(`users/${userId}`);
    const userDocSnap = await userDocRef.get();
    if (!userDocSnap.exists) throw new Error("Current user not found in database for bot match.");

    const currentUserData = userDocSnap.data()!;
    const botId = `bot_${Math.random().toString(36).substring(2, 9)}`;
    const botName = botNames[Math.floor(Math.random() * botNames.length)];
    const botAvatar = `https://avatar.iran.liara.run/public/girl?username=${botName.replace(/\s/g, '')}`;
    
    // Use a unique ID for bot conversations that isn't dependent on sorting
    const botConvoRef = db.collection('temporaryConversations').doc();
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 3);

    await botConvoRef.set({
        user1: { uid: currentUserData.uid, name: currentUserData.name, avatarUrl: currentUserData.avatarUrl, heartClicked: false },
        user2: { uid: botId, name: botName, avatarUrl: botAvatar, heartClicked: false },
        isBotMatch: true,
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(expiresAt),
        // Add a users array for potential queries, although less critical for bot matches
        users: [currentUserData.uid, botId]
    });
    
    // Add bot's opener message
    await botConvoRef.collection('messages').add({
        text: botOpenerMessages[Math.floor(Math.random() * botOpenerMessages.length)],
        senderId: botId,
        timestamp: Timestamp.now()
    });

    return { conversationId: botConvoRef.id, isBotMatch: true };
}


export async function findMatch(input: FindMatchInput): Promise<FindMatchOutput> {
    const { userId } = input;
    const waitingPoolCollection = db.collection('waitingPool');
    const userInPoolRef = waitingPoolCollection.doc(userId);

    try {
        const matchOutput = await db.runTransaction(async (transaction) => {
            const userInPoolDoc = await transaction.get(userInPoolRef);
            
            // Check if user has been waiting for more than the timeout
            if (userInPoolDoc.exists) {
                const waitingSince = (userInPoolDoc.data()!.waitingSince as Timestamp).toDate();
                const now = new Date();
                if (now.getTime() - waitingSince.getTime() > MATCH_TIMEOUT_SECONDS * 1000) {
                     transaction.delete(userInPoolRef);
                     // The 'true' signals that we will create a bot match outside the transaction
                     return { createBotMatch: true };
                }
            }
            
            // Look for another user to match with
            const waitingQuery = waitingPoolCollection
                .where(FieldPath.documentId(), '!=', userId)
                .orderBy(FieldPath.documentId())
                .orderBy('waitingSince')
                .limit(1);
            
            const waitingSnapshot = await transaction.get(waitingQuery);

            if (waitingSnapshot.empty) {
                // No one is waiting. Add/update current user's entry in the pool.
                if (!userInPoolDoc.exists) {
                     transaction.set(userInPoolRef, {
                        uid: userId,
                        waitingSince: Timestamp.now(),
                    });
                }
                // Return null to indicate the user is now waiting
                return { conversationId: null, isBotMatch: false }; 
            }
            
            // Found a waiting user. Create a real match.
            const otherUserDoc = waitingSnapshot.docs[0];
            const otherUserData = otherUserDoc.data();

            const [user1Doc, user2Doc] = await Promise.all([
                transaction.get(db.doc(`users/${userId}`)),
                transaction.get(db.doc(`users/${otherUserData.uid}`))
            ]);
            
            if (!user1Doc.exists || !user2Doc.exists) {
                throw new Error("One or both users not found in the 'users' collection.");
            }
            const user1Data = user1Doc.data()!;
            const user2Data = user2Doc.data()!;

            const newConvoRef = db.collection('temporaryConversations').doc();
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 3);

            transaction.set(newConvoRef, {
                user1: { uid: user1Data.uid, name: user1Data.name, avatarUrl: user1Data.avatarUrl, heartClicked: false },
                user2: { uid: user2Data.uid, name: user2Data.name, avatarUrl: user2Data.avatarUrl, heartClicked: false },
                isBotMatch: false,
                createdAt: Timestamp.now(),
                expiresAt: Timestamp.fromDate(expiresAt),
                users: [user1Data.uid, user2Data.uid]
            });
            
            // Remove both users from the pool
            transaction.delete(userInPoolRef);
            transaction.delete(otherUserDoc.ref);

            return { conversationId: newConvoRef.id, isBotMatch: false };
        });
        
        // If the transaction flagged to create a bot match, do it now.
        if (matchOutput && (matchOutput as any).createBotMatch) {
            return await createBotMatch(userId);
        }

        // Otherwise, return the result of the transaction (either a match or null)
        return matchOutput as FindMatchOutput;

    } catch (error: any) {
        console.error('Matchmaking flow failed:', error);
        // Clean up user from pool just in case of an unexpected error.
        await userInPoolRef.delete().catch(() => {});
        // As a last resort, give them a bot match.
        return createBotMatch(userId);
    }
}
