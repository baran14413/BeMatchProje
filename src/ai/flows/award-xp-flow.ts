
'use server';
/**
 * @fileOverview A Genkit flow for awarding XP to users and handling level ups.
 *
 * - awardXp - Awards a specified amount of XP to a user.
 * - AwardXpInput - The input type for the awardXp function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, serverTimestamp } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { XP_REASONS, getXpForAction } from '@/config/xp-config';

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
  async ({ userId, xpAmount, reason }) => {
    if (!getApps().length) {
        initializeApp();
    }
    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);

    try {
      let leveledUp = false;
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          console.error(`User ${userId} not found.`);
          return;
        }

        const userData = userDoc.data()!;
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
           const levelUpNotifRef = db.collection('notifications').doc();
           transaction.set(levelUpNotifRef, {
               recipientId: userId,
               type: 'level_up',
               content: `Seviye ${currentLevel}`,
               read: false,
               createdAt: serverTimestamp(),
               fromUser: {
                   uid: 'system',
                   name: 'BeMatch',
                   avatar: '/icons/app-logo.svg' // System avatar
               }
           });
        }
        
        // Create a notification for XP gain, if there's a reason
        if (reason) {
            const xpReasonText = XP_REASONS[reason as keyof typeof XP_REASONS] || reason;
            const xpGainNotifRef = db.collection('notifications').doc();
            transaction.set(xpGainNotifRef, {
                recipientId: userId,
                type: 'xp_gain',
                content: `${xpReasonText} için **+${xpAmount} XP** kazandın!`,
                read: false,
                createdAt: serverTimestamp(),
                fromUser: {
                   uid: 'system',
                   name: 'BeMatch',
                   avatar: '/icons/app-logo.svg'
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
  input: Omit<AwardXpInput, 'xpAmount'> & { xpAmount?: number; reason?: keyof typeof XP_REASONS | string }
): Promise<{ success: boolean; leveledUp: boolean }> {
  // If a reason is provided, get the XP from the config. Otherwise, use the amount directly.
  const xpToAward = input.reason ? getXpForAction(input.reason as any) : (input.xpAmount || 0);

  // Safety check: Do not call the flow if the XP amount is not positive.
  if (xpToAward <= 0) {
    return { success: true, leveledUp: false }; // Silently succeed without doing anything.
  }
  
  return awardXpFlow({ userId: input.userId, reason: input.reason, xpAmount: xpToAward });
}
