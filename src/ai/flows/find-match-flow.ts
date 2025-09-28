
'use server';
/**
 * @fileOverview A Genkit flow for matching users for a random chat.
 *
 * This flow provides a robust, transaction-based matchmaking system.
 * - findMatch: Tries to find a waiting user, otherwise adds the current user to the waiting pool.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
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


export async function findMatch(input: FindMatchInput): Promise<FindMatchOutput> {
  return findMatchFlow(input);
}

const findMatchFlow = ai.defineFlow(
  {
    name: 'findMatchFlow',
    inputSchema: FindMatchInputSchema,
    outputSchema: FindMatchOutputSchema,
  },
  async ({ userId }) => {
    if (!getApps().length) {
      initializeApp();
    }
    const db = getFirestore();
    const waitingPoolRef = db.collection('waitingPool');

    try {
      // Transaction to find and match a user atomically
      const result = await db.runTransaction(async (transaction) => {
        const waitingQuery = waitingPoolRef
          .where('uid', '!=', userId)
          .orderBy('uid') // Order by UID to avoid contention on the same document
          .orderBy('waitingSince', 'asc')
          .limit(1);
        
        const waitingSnapshot = await transaction.get(waitingQuery);

        if (!waitingSnapshot.empty) {
          // Found a waiting user, let's create a match!
          const waitingUserDoc = waitingSnapshot.docs[0];
          const waitingUserData = waitingUserDoc.data();

          const currentUserDocRef = db.doc(`users/${userId}`);
          const currentUserDoc = await transaction.get(currentUserDocRef);
          if (!currentUserDoc.exists) throw "Current user not found in database.";
          const currentUserData = currentUserDoc.data()!;

          // Create a new temporary conversation document
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

          // Remove the waiting user from the pool
          transaction.delete(waitingUserDoc.ref);
          
          return { conversationId: newConvoRef.id, isBotMatch: false, status: 'matched' };
          
        } else {
            // No one is waiting. Check if the user is ALREADY waiting.
            const userWaitingDoc = await transaction.get(waitingPoolRef.doc(userId));

            if (userWaitingDoc.exists()) {
                // User has waited long enough, create a bot match.
                const currentUserDoc = await transaction.get(db.doc(`users/${userId}`));
                if (!currentUserDoc.exists) throw "Current user not found.";
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
                
                // Add a first message from the bot
                 const botMessageRef = botConvoRef.collection('messages').doc();
                 transaction.set(botMessageRef, {
                    text: botOpenerMessages[Math.floor(Math.random() * botOpenerMessages.length)],
                    senderId: botId,
                    timestamp: Timestamp.now()
                 });

                // Remove user from waiting pool
                transaction.delete(userWaitingDoc.ref);

                return { conversationId: botConvoId, isBotMatch: true, status: 'bot_matched' };

            } else {
                 // User is not waiting, so add them to the pool
                const userDocRef = db.doc(`users/${userId}`);
                const userDoc = await transaction.get(userDocRef);
                if (!userDoc.exists) throw "User document does not exist.";
                
                const newWaitingRef = waitingPoolRef.doc(userId);
                transaction.set(newWaitingRef, {
                    uid: userId,
                    name: userDoc.data()!.name,
                    avatarUrl: userDoc.data()!.avatarUrl,
                    waitingSince: Timestamp.now(),
                });
                return { conversationId: null, isBotMatch: false, status: 'waiting' };
            }
        }
      });
      
      return { conversationId: result.conversationId, isBotMatch: result.isBotMatch };

    } catch (error: any) {
      console.error('Matchmaking flow failed:', error);
      // If the user was added to the pool but the flow failed, try to remove them
      await waitingPoolRef.doc(userId).delete().catch(() => {});
      return { conversationId: null, isBotMatch: false };
    }
  }
);
