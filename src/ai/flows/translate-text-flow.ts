'use server';
/**
 * @fileOverview An AI flow for translating text.
 *
 * - translateText - Translates text to Turkish if it's not already in Turkish.
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
  sourceLanguage: z.string().optional().describe('The detected source language code (e.g., "en", "tr").'),
  error: z.string().optional().describe('An error message if translation failed.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
  return translateTextFlow(input);
}

const LanguageDetectionPromptSchema = z.object({
    isTurkish: z.boolean(),
    languageCode: z.string().describe("The ISO 639-1 code for the detected language, e.g., 'en', 'fr', 'tr'.")
});

const languageDetectionPrompt = ai.definePrompt({
    name: 'languageDetectionPrompt',
    input: { schema: z.object({ text: z.string() }) },
    output: { schema: LanguageDetectionPromptSchema },
    system: `Detect the language of the given text. Determine if it is Turkish. Return the ISO 639-1 language code.`,
    prompt: `Text: "{{{text}}}"`
});


const translationPrompt = ai.definePrompt({
  name: 'translateTextPrompt',
  input: {schema: TranslateTextInputSchema},
  output: {schema: z.object({ translatedText: z.string() })},
  model: 'googleai/gemini-1.5-flash',
  system: `You are an expert translator. Your task is to translate the given text into natural-sounding Turkish.
  Provide only the translated text as output. Do not add any extra explanations or text.`,
  prompt: `Please translate the following text to Turkish:

"{{{textToTranslate}}}"`,
});

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async ({ textToTranslate }) => {
    try {
      if (!textToTranslate.trim()) {
        return { sourceLanguage: 'tr' }; // Treat empty string as Turkish
      }
      
      const { output: detection } = await languageDetectionPrompt({ text: textToTranslate });

      if (!detection) {
        throw new Error('Language detection failed.');
      }
      
      if (detection.isTurkish || detection.languageCode === 'tr') {
          return { sourceLanguage: 'tr' }; // It's already Turkish, no need to translate
      }

      // If not Turkish, translate it
      const { output: translation } = await translationPrompt({ textToTranslate });
      if (!translation) {
          throw new Error('Translation model did not return a result.');
      }
      
      return { 
          translatedText: translation.translatedText,
          sourceLanguage: detection.languageCode,
      };

    } catch (e: any) {
        console.error("Translation flow failed", e);
        return { error: 'Çeviri modeli şu anda yoğun. Lütfen daha sonra tekrar deneyin.' };
    }
  }
);
