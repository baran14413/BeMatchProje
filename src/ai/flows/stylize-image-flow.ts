'use server';
/**
 * @fileOverview An AI flow for stylizing an image based on a text prompt.
 *
 * - stylizeImage - Applies a style to an image based on a text prompt.
 * - StylizeImageInput - The input type for the stylizeImage function.
 * - StylizeImageOutput - The return type for the stylizeImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StylizeImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "The original photo to be stylized, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  prompt: z.string().describe('The text prompt describing the desired style.'),
});
export type StylizeImageInput = z.infer<typeof StylizeImageInputSchema>;

const StylizeImageOutputSchema = z.object({
  stylizedImageDataUri: z
    .string()
    .optional()
    .describe('The stylized image as a Base64 encoded data URI.'),
  error: z
    .string()
    .optional()
    .describe('An error message if the stylization failed.'),
});
export type StylizeImageOutput = z.infer<typeof StylizeImageOutputSchema>;

export async function stylizeImage(
  input: StylizeImageInput
): Promise<StylizeImageOutput> {
  return stylizeImageFlow(input);
}

const stylizeImageFlow = ai.defineFlow(
  {
    name: 'stylizeImageFlow',
    inputSchema: StylizeImageInputSchema,
    outputSchema: StylizeImageOutputSchema,
  },
  async ({photoDataUri, prompt}) => {
    try {
      const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: [
          {media: {url: photoDataUri}},
          {text: `Apply the following style to the image: ${prompt}`},
        ],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      if (!media?.url) {
        throw new Error('The model did not return an image.');
      }

      return {stylizedImageDataUri: media.url};
    } catch (e: any) {
      console.error('Image stylization flow failed', e);
      return {
        error:
          'Görsel stili uygulanırken bir hata oluştu. Lütfen tekrar deneyin.',
      };
    }
  }
);
