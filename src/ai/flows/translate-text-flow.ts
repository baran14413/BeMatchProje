'use server';
/**
 * @fileOverview An AI flow for translating text.
 *
 * - translateText - Translates text to Turkish.
 * - TranslateTextInput - The input type for the translateText function.
 * - TranslateTextOutput - The return type for the translateText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateTextInputSchema = z.object({
  textToTranslate: z
    .string()
    .describe('The text that needs to be translated.'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translatedText: z.string().optional().describe('The translated text in Turkish.'),
  error: z.string().optional().describe('An error message if translation failed.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
  return translateTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateTextPrompt',
  input: {schema: TranslateTextInputSchema},
  output: {schema: TranslateTextOutputSchema},
  model: 'googleai/gemini-1.5-flash',
  system: `You are an expert translator. Your task is to translate the given text into Turkish.
  Provide only the translated text as output.`,
  prompt: `Please translate the following text to Turkish:

"{{{textToTranslate}}}"`,
});

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      return output!;
    } catch (e: any) {
        console.error("Translation flow failed", e);
        return { error: 'Çeviri modeli şu anda yoğun. Lütfen daha sonra tekrar deneyin.' };
    }
  }
);
