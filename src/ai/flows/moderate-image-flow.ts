'use server';
/**
 * @fileOverview An AI flow for moderating uploaded images.
 *
 * - moderateImage - Checks if an image is appropriate for a profile picture.
 * - ModerateImageInput - The input type for the moderateImage function.
 * - ModerateImageOutput - The return type for the moderateImage function.
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';

const ModerateImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to be moderated, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ModerateImageInput = z.infer<typeof ModerateImageInputSchema>;

const ModerateImageOutputSchema = z.object({
  isSafe: z.boolean().describe('Whether the image is considered safe and appropriate for a profile picture.'),
  reason: z.string().optional().describe('The reason why the image was flagged as not safe. Only present if isSafe is false.'),
});
export type ModerateImageOutput = z.infer<typeof ModerateImageOutputSchema>;

export async function moderateImage(input: ModerateImageInput): Promise<ModerateImageOutput> {
  return moderateImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'moderateImagePrompt',
  input: {schema: ModerateImageInputSchema},
  output: {schema: ModerateImageOutputSchema},
  model: 'googleai/gemini-1.5-flash',
  system: `You are an expert image moderator for a dating application.
You need to determine if the provided image is appropriate for a user's profile picture.

The image should be flagged as NOT SAFE if it contains any of the following:
- Nudity or sexually suggestive content.
- Violence, gore, or weapons.
- Hateful symbols or gestures.
- Illegal activities or substances.
- Is not a real photo (e.g., a cartoon, illustration, or meme).
- Does not contain a person.

If the image is safe, set isSafe to true.
If the image is not safe, set isSafe to false and provide a brief, user-friendly reason in Turkish.`,
  prompt: `Please moderate this image: {{media url=photoDataUri}}`,
});

const moderateImageFlow = ai.defineFlow(
  {
    name: 'moderateImageFlow',
    inputSchema: ModerateImageInputSchema,
    outputSchema: ModerateImageOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      return output!;
    } catch (e: any) {
        console.error("Image moderation flow failed", e);
        return { 
            isSafe: false, 
            reason: 'Denetleme modeli şu anda yoğun. Lütfen daha sonra tekrar deneyin.'
        };
    }
  }
);
