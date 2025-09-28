
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
    
    const botConvoRef = db.collection('temporaryConversations').doc();
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 3);

    await botConvoRef.set({
        user1: { uid: currentUserData.uid, name: currentUserData.name, avatarUrl: currentUserData.avatarUrl, heartClicked: false },
        user2: { uid: botId, name: botName, avatarUrl: botAvatar, heartClicked: false },
        isBotMatch: true,
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(expiresAt),
        users: [currentUserData.uid, botId]
    });
    
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
        const transactionResult = await db.runTransaction(async (transaction) => {
            const userInPoolDoc = await transaction.get(userInPoolRef);

            // If user is already in pool, check if timeout has passed.
            if (userInPoolDoc.exists) {
                const waitingSince = (userInPoolDoc.data()!.waitingSince as Timestamp).toDate();
                const now = new Date();
                if (now.getTime() - waitingSince.getTime() > MATCH_TIMEOUT_SECONDS * 1000) {
                     transaction.delete(userInPoolRef);
                     return { createBotMatch: true }; // Signal to create a bot match outside transaction
                }
            }

            // Look for another user in the pool.
            const waitingQuery = waitingPoolCollection
                .where(db.app.options.projectId ? '__name__' : 'uid', '!=', userId) // Firestore-Admin-SDK uses __name__
                .orderBy(db.app.options.projectId ? '__name__' : 'uid')
                .orderBy('waitingSince')
                .limit(1);
            
            const waitingSnapshot = await transaction.get(waitingQuery);

            // If no one is waiting, add the current user to the pool.
            if (waitingSnapshot.empty) {
                if (!userInPoolDoc.exists) {
                     transaction.set(userInPoolRef, {
                        uid: userId,
                        waitingSince: Timestamp.now(),
                    });
                }
                return { conversationId: null, isBotMatch: false, createBotMatch: false }; 
            }
            
            // Found a match!
            const otherUserDoc = waitingSnapshot.docs[0];
            const otherUserData = otherUserDoc.data();

            const [user1Doc, user2Doc] = await Promise.all([
                transaction.get(db.doc(`users/${userId}`)),
                transaction.get(db.doc(`users/${otherUserData.uid}`))
            ]);
            
            if (!user1Doc.exists || !user2Doc.exists) {
                // If for some reason user docs don't exist, remove from pool and retry.
                if (userInPoolDoc.exists) transaction.delete(userInPoolRef);
                if (otherUserDoc.exists) transaction.delete(otherUserDoc.ref);
                throw new Error("One or both users not found in the 'users' collection during match.");
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
            
            // Clean up both users from the waiting pool
            if (userInPoolDoc.exists) transaction.delete(userInPoolRef);
            transaction.delete(otherUserDoc.ref);

            return { conversationId: newConvoRef.id, isBotMatch: false, createBotMatch: false };
        });
        
        // If transaction signaled to create a bot match, do it now.
        if (transactionResult.createBotMatch) {
            return await createBotMatch(userId);
        }

        return transactionResult as FindMatchOutput;

    } catch (error: any) {
        console.error('Matchmaking flow failed:', error);
        // Fallback to bot match on any critical failure to prevent user from being stuck.
        await userInPoolRef.delete().catch(() => {});
        return await createBotMatch(userId);
    }
}
