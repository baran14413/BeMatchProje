
'use server';
/**
 * @fileOverview A Genkit flow for retrieving simulated system information.
 *
 * - getSystemInfo - Fetches simulated system metrics like CPU status.
 * - GetSystemInfoInput - The input type for the getSystemInfo function.
 * - GetSystemInfoOutput - The return type for the getSystemInfo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GetSystemInfoInputSchema = z.object({
  infoType: z.enum(['cpu']).describe('The type of system information to retrieve.'),
});
export type GetSystemInfoInput = z.infer<typeof GetSystemInfoInputSchema>;


const CpuInfoSchema = z.object({
    model: z.string().describe('İşlemcinin marka ve modeli.'),
    cores: z.number().describe('Toplam fiziksel çekirdek sayısı.'),
    usage: z.string().describe('Anlık işlemci kullanım yüzdesi.'),
    load: z.string().describe('Son 1 dakikalık ortalama sistem yükü.'),
    health: z.string().describe('İşlemcinin genel sağlık durumu.'),
});

const GetSystemInfoOutputSchema = z.object({
  infoType: z.string(),
  data: CpuInfoSchema.nullable(),
  error: z.string().optional(),
});
export type GetSystemInfoOutput = z.infer<typeof GetSystemInfoOutputSchema>;

export async function getSystemInfo(input: GetSystemInfoInput): Promise<GetSystemInfoOutput> {
    return getSystemInfoFlow(input);
}


const getSystemInfoFlow = ai.defineFlow(
  {
    name: 'getSystemInfoFlow',
    inputSchema: GetSystemInfoInputSchema,
    outputSchema: GetSystemInfoOutputSchema,
  },
  async ({ infoType }) => {
    if (infoType === 'cpu') {
      // In a real environment, you would use a library like 'os' or 'systeminformation'
      // to get actual data. Here, we simulate it for the sandboxed environment.
      const usage = `${(Math.random() * 25 + 5).toFixed(2)}%`; // Simulate 5-30% usage
      const load = `${(Math.random() * 0.8).toFixed(2)}`;
      const health = `${(100 - (Math.random() * 5)).toFixed(0)}%`;

      return {
        infoType: 'cpu',
        data: {
          model: 'Simulated Intel Xeon (2.5 GHz)',
          cores: 2,
          usage: usage,
          load: `${load} (Düşük)`,
          health: `İyi (${health})`,
        },
      };
    }

    return {
      infoType: infoType,
      data: null,
      error: `'${infoType}' için bilgi alınamadı.`,
    };
  }
);
