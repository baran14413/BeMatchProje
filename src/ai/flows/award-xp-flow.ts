
'use server';
/**
 * @fileOverview A Genkit flow for awarding XP to users and handling level ups.
 *
 * - awardXp - Awards a specified amount of XP to a user.
 * - AwardXpInput - The input type for the awardXp function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, doc, runTransaction, serverTimestamp, collection, addDoc } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

const AwardXpInputSchema = z.object({
  userId: z.string().describe('The UID of the user to award XP to.'),
  xpAmount: z.number().int().positive().describe('The amount of XP to award.'),
  reason: z.string().optional().describe('The reason for awarding XP (e.g., "new_post").'),
});
export type AwardXpInput = z.infer<typeof AwardXpInputSchema>;

const calculateXpForNextLevel = (level: number) => (level + 1) * 100;

const awardXpFlow = ai.defineFlow(
  {
    name: 'awardXpFlow',
    inputSchema: AwardXpInputSchema,
    outputSchema: z.object({ success: z.boolean(), leveledUp: z.boolean() }),
  },
  async ({ userId, xpAmount }) => {
    if (!getApps().length) {
        initializeApp();
    }
    const db = getFirestore();
    const userRef = doc(db, 'users', userId);

    try {
      let leveledUp = false;
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          console.error(`User ${userId} not found.`);
          return;
        }

        const userData = userDoc.data();
        let currentLevel = userData.level || 1;
        let currentXp = userData.xp || 0;
        
        let newXp = currentXp + xpAmount;
        let xpForNextLevel = calculateXpForNextLevel(currentLevel);

        while (newXp >= xpForNextLevel) {
          newXp -= xpForNextLevel;
          currentLevel++;
          leveledUp = true;
          xpForNextLevel = calculateXpForNextLevel(currentLevel);
          
           // Create a notification for level up
           const notificationRef = doc(collection(db, 'notifications'));
           transaction.set(notificationRef, {
               recipientId: userId,
               type: 'level_up',
               content: `Tebrikler! Seviye ${currentLevel}'e ulaştın!`,
               read: false,
               createdAt: serverTimestamp(),
               fromUser: {
                   uid: 'system',
                   name: 'BeMatch',
                   avatar: '/icons/app-logo.svg' // System avatar
               }
           });
        }
        
        transaction.update(userRef, {
          xp: newXp,
          level: currentLevel,
        });
      });
      return { success: true, leveledUp };
    } catch (error: any) {
      console.error(`Failed to award XP to user ${userId}:`, error);
      return { success: false, leveledUp: false };
    }
  }
);


export async function awardXp(
  input: AwardXpInput
): Promise<{ success: boolean; leveledUp: boolean }> {
  return awardXpFlow(input);
}
