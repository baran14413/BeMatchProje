'use server';
/**
 * @fileOverview An AI flow to moderate images for inappropriate content.
 *
 * - moderateImage - A function that handles the image moderation process.
 * - ModerateImageInput - The input type for the moderateImage function.
 * - ModerateImageOutput - The return type for the moderateImage function.
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
  isSafe: z.boolean().describe('Whether the image is safe to be used as a profile picture.'),
  reason: z.string().optional().describe('The reason why the image is not safe. This is only present if isSafe is false.'),
});
export type ModerateImageOutput = z.infer<typeof ModerateImageOutputSchema>;

export async function moderateImage(input: ModerateImageInput): Promise<ModerateImageOutput> {
  return moderateImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'moderateImagePrompt',
  input: {schema: ModerateImageInputSchema},
  output: {schema: ModerateImageOutputSchema},
  prompt: `You are an image moderation expert for a dating app. Your task is to determine if the given image is appropriate for a user's profile picture.

Check for the following violations:
- Nudity or sexually suggestive content.
- Violence or gore.
- Hate symbols or offensive gestures.
- Clearly visible faces of children.
- Text that is offensive or hateful.
- Drug use or paraphernalia.
- Anything that is not a real person (e.g., cartoons, memes, inanimate objects, abstract art). The profile picture must be a photo of the user.

Based on the image, decide if it's safe. If it's not safe, provide a concise, user-friendly reason in Turkish.

Photo: {{media url=photoDataUri}}`,
  config: {
    safetySettings: [
        {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_NONE',
        },
        {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_NONE',
        },
        {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_NONE',
        },
        {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_NONE',
        },
    ]
  }
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
