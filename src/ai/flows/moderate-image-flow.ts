'use server';
/**
 * @fileOverview A flow for moderating user-uploaded profile pictures.
 *
 * - moderateImage: A function that handles the image moderation process.
 * - ModerateImageInput: The input type for the moderateImage function.
 * - ModerateImageOutput: The return type for the moderateImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ModerateImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to be moderated, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ModerateImageInput = z.infer<typeof ModerateImageInputSchema>;

const ModerateImageOutputSchema = z.object({
  isSafe: z.boolean().describe('Whether or not the image is considered safe and appropriate for a dating profile.'),
  reason: z.string().optional().describe('The reason why the image was flagged as not safe. This is only present if isSafe is false.'),
});
export type ModerateImageOutput = z.infer<typeof ModerateImageOutputSchema>;

export async function moderateImage(input: ModerateImageInput): Promise<ModerateImageOutput> {
  return moderateImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'moderateImagePrompt',
  input: {schema: ModerateImageInputSchema},
  output: {schema: ModerateImageOutputSchema},
  model: 'googleai/gemini-1.5-flash-preview',
  prompt: `You are a content moderator for a dating application. Your task is to determine if the provided image is appropriate to be used as a profile picture.

  The image should be flagged as not safe if it contains any of the following:
  - Nudity or sexually suggestive content.
  - Violence, gore, or weapons.
  - Hate symbols, offensive gestures, or illegal activities.
  - Minors (children).
  - Text or memes that are not a person's face.
  - The face is not clearly visible.

  Analyze the image and respond with whether it is safe or not. If it is not safe, provide a brief, user-friendly reason.

  Image: {{media url=photoDataUri}}`,
});

const moderateImageFlow = ai.defineFlow(
  {
    name: 'moderateImageFlow',
    inputSchema: ModerateImageInputSchema,
    outputSchema: ModerateImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
