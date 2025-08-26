
'use server';
/**
 * @fileOverview Genkit flows for managing IP blocking.
 *
 * - blockIp - Adds an IP address to the blocklist.
 * - unblockIp - Removes an IP address from the blocklist.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, serverTimestamp, doc, setDoc, deleteDoc } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

// Input schema for blocking an IP
const BlockIpInputSchema = z.object({
  ipAddress: z.string().ip().describe('The IP address to block.'),
  reason: z.string().optional().describe('The reason for blocking the IP.'),
});
export type BlockIpInput = z.infer<typeof BlockIpInputSchema>;

// Input schema for unblocking an IP
const UnblockIpInputSchema = z.object({
  ipAddress: z.string().ip().describe('The IP address to unblock.'),
});
export type UnblockIpInput = z.infer<typeof UnblockIpInputSchema>;

// Generic output schema
const ManagementOutputSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});
export type ManagementOutput = z.infer<typeof ManagementOutputSchema>;

// Exported function to block an IP
export async function blockIp(input: BlockIpInput): Promise<ManagementOutput> {
    return blockIpFlow(input);
}

// Exported function to unblock an IP
export async function unblockIp(input: UnblockIpInput): Promise<ManagementOutput> {
    return unblockIpFlow(input);
}


const blockIpFlow = ai.defineFlow(
  {
    name: 'blockIpFlow',
    inputSchema: BlockIpInputSchema,
    outputSchema: ManagementOutputSchema,
  },
  async ({ ipAddress, reason }) => {
    if (!getApps().length) {
        initializeApp();
    }
    const db = getFirestore();

    try {
        const blockRef = doc(db, 'blocked-ips', ipAddress);
        await setDoc(blockRef, {
            reason: reason || 'Neden belirtilmedi',
            blockedAt: serverTimestamp(),
        });
        return { success: true };
    } catch (error: any) {
        console.error(`Failed to block IP ${ipAddress}:`, error);
        return { success: false, error: `IP engellenemedi: ${error.message}` };
    }
  }
);


const unblockIpFlow = ai.defineFlow(
  {
    name: 'unblockIpFlow',
    inputSchema: UnblockIpInputSchema,
    outputSchema: ManagementOutputSchema,
  },
  async ({ ipAddress }) => {
    if (!getApps().length) {
        initializeApp();
    }
    const db = getFirestore();

    try {
        const blockRef = doc(db, 'blocked-ips', ipAddress);
        await deleteDoc(blockRef);
        return { success: true };
    } catch (error: any) {
        console.error(`Failed to unblock IP ${ipAddress}:`, error);
        return { success: false, error: `IP engeli kaldırılamadı: ${error.message}` };
    }
  }
);
