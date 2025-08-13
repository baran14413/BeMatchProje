'use server';
/**
 * @fileOverview An AI flow for verifying a user's face from a camera snapshot.
 *
 * - verifyFace - Checks if an image contains a real, live person's face.
 * - VerifyFaceInput - The input type for the verifyFace function.
 * - VerifyFaceOutput - The return type for the verifyFace function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VerifyFaceInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A snapshot from a camera, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type VerifyFaceInput = z.infer<typeof VerifyFaceInputSchema>;

const VerifyFaceOutputSchema = z.object({
  isLive: z.boolean().describe('Whether the image is considered to be of a live person.'),
  isFace: z.boolean().describe('Whether the image contains a human face.'),
  reason: z.string().optional().describe('The reason why the verification failed. Only present if isLive or isFace is false.'),
});
export type VerifyFaceOutput = z.infer<typeof VerifyFaceOutputSchema>;

export async function verifyFace(input: VerifyFaceInput): Promise<VerifyFaceOutput> {
  return verifyFaceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'verifyFacePrompt',
  input: {schema: VerifyFaceInputSchema},
  output: {schema: VerifyFaceOutputSchema},
  model: 'googleai/gemini-1.5-flash',
  system: `You are an expert in identity verification for a dating application.
You need to determine if the provided image is a live photo of a real person suitable for identity verification.

The verification should FAIL if:
- The image does not contain a clear human face.
- The image appears to be a photo of a screen, a printed photo, a doll, a statue, or anything other than a live person.
- The face is obscured by masks, heavy sunglasses, or other objects.

If the image is a valid, live photo of a person's face, set both isLive and isFace to true.
Otherwise, set the appropriate boolean to false and provide a brief, user-friendly reason in Turkish.`,
  prompt: `Please verify this face snapshot: {{media url=photoDataUri}}`,
});

const verifyFaceFlow = ai.defineFlow(
  {
    name: 'verifyFaceFlow',
    inputSchema: VerifyFaceInputSchema,
    outputSchema: VerifyFaceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
