
'use server';
/**
 * @fileOverview A Genkit flow for matching users for a random chat.
 *
 * This flow provides a robust, transaction-based matchmaking system.
 * - findMatch: Tries to find a waiting user. If none, adds the user to the pool.
 *              If called again for a user still in the pool, it creates a bot match.
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

export async function findMatch(input: FindMatchInput): Promise<FindMatchOutput> {
    const { userId } = input;
    const waitingPoolRef = db.collection('waitingPool');

    try {
        const result = await db.runTransaction(async (transaction) => {
            const userWaitingDocRef = waitingPoolRef.doc(userId);
            const userWaitingDoc = await transaction.get(userWaitingDocRef);

            if (userWaitingDoc.exists()) {
                // User is already waiting. This means the timer ran out. Create a bot match.
                const currentUserDoc = await transaction.get(db.doc(`users/${userId}`));
                if (!currentUserDoc.exists) throw new Error("Current user not found in database.");
                const currentUserData = currentUserDoc.data()!;
                
                const botId = `bot_${Math.random().toString(36).substring(2, 9)}`;
                const botName = botNames[Math.floor(Math.random() * botNames.length)];
                const botAvatar = `https://avatar.iran.liara.run/public/girl?username=${botName.replace(/\s/g, '')}`;
                
                const botConvoId = [userId, botId].sort().join('-');
                const botConvoRef = db.collection('temporaryConversations').doc(botConvoId);
                
                const expiresAt = new Date();
                expiresAt.setMinutes(expiresAt.getMinutes() + 3);

                transaction.set(botConvoRef, {
                    user1: { uid: currentUserData.uid, name: currentUserData.name, avatarUrl: currentUserData.avatarUrl, heartClicked: false },
                    user2: { uid: botId, name: botName, avatarUrl: botAvatar, heartClicked: false },
                    isBotMatch: true,
                    createdAt: Timestamp.now(),
                    expiresAt: Timestamp.fromDate(expiresAt),
                });
                
                const botMessageRef = botConvoRef.collection('messages').doc();
                transaction.set(botMessageRef, {
                    text: botOpenerMessages[Math.floor(Math.random() * botOpenerMessages.length)],
                    senderId: botId,
                    timestamp: Timestamp.now()
                });

                // Remove user from waiting pool
                transaction.delete(userWaitingDocRef);

                return { conversationId: botConvoId, isBotMatch: true };
            }

            // User is not waiting, look for someone else.
            const waitingQuery = waitingPoolRef
                .where('uid', '!=', userId)
                .orderBy('uid')
                .orderBy('waitingSince', 'asc')
                .limit(1);
            
            const waitingSnapshot = await transaction.get(waitingQuery);

            if (!waitingSnapshot.empty) {
                // Found a waiting user, create a real match!
                const waitingUserDoc = waitingSnapshot.docs[0];
                const waitingUserData = waitingUserDoc.data();

                const currentUserDoc = await transaction.get(db.doc(`users/${userId}`));
                if (!currentUserDoc.exists) throw new Error("Current user not found in database.");
                const currentUserData = currentUserDoc.data()!;

                const newConvoRef = db.collection('temporaryConversations').doc();
                const expiresAt = new Date();
                expiresAt.setMinutes(expiresAt.getMinutes() + 3); // 3 MINUTE LIMIT

                transaction.set(newConvoRef, {
                    user1: { uid: waitingUserData.uid, name: waitingUserData.name, avatarUrl: waitingUserData.avatarUrl, heartClicked: false },
                    user2: { uid: currentUserData.uid, name: currentUserData.name, avatarUrl: currentUserData.avatarUrl, heartClicked: false },
                    isBotMatch: false,
                    createdAt: Timestamp.now(),
                    expiresAt: Timestamp.fromDate(expiresAt),
                });

                transaction.delete(waitingUserDoc.ref);
                
                return { conversationId: newConvoRef.id, isBotMatch: false };
            } else {
                // No one is waiting. Add the current user to the pool.
                const userDoc = await transaction.get(db.doc(`users/${userId}`));
                if (!userDoc.exists) throw new Error("User document does not exist.");
                
                transaction.set(userWaitingDocRef, {
                    uid: userId,
                    name: userDoc.data()!.name,
                    avatarUrl: userDoc.data()!.avatarUrl,
                    waitingSince: Timestamp.now(),
                });
                return { conversationId: null, isBotMatch: false };
            }
        });
      
        return result;

    } catch (error: any) {
        console.error('Matchmaking flow failed:', error);
        // Ensure user is removed from pool on failure
        await db.collection('waitingPool').doc(userId).delete().catch(() => {});
        return { conversationId: null, isBotMatch: false };
    }
}
