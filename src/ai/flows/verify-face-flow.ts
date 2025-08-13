'use server';
/**
 * @fileOverview A flow for verifying if two faces belong to the same person.
 *
 * - verifyFace: A function that handles the face verification process.
 * - VerifyFaceInput: The input type for the verifyFace function.
 * - VerifyFaceOutput: The return type for the verifyFace function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VerifyFaceInputSchema = z.object({
  livePhotoDataUri: z
    .string()
    .describe(
      "A photo captured from the live verification video stream, as a data URI."
    ),
  profilePhotoDataUri: z
    .string()
    .describe(
      "The profile photo uploaded by the user, as a data URI."
    ),
});
export type VerifyFaceInput = z.infer<typeof VerifyFaceInputSchema>;

const VerifyFaceOutputSchema = z.object({
  isSamePerson: z.boolean().describe('Whether or not the two faces are determined to belong to the same person.'),
  reason: z.string().optional().describe('The reason for the determination, especially if they are not the same person.'),
});
export type VerifyFaceOutput = z.infer<typeof VerifyFaceOutputSchema>;

export async function verifyFace(input: VerifyFaceInput): Promise<VerifyFaceOutput> {
  return verifyFaceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'verifyFacePrompt',
  input: {schema: VerifyFaceInputSchema},
  output: {schema: VerifyFaceOutputSchema},
  model: 'googleai/gemini-1.5-flash-preview',
  prompt: `You are a highly advanced face verification system for a dating application. Your task is to determine if two images contain the face of the same person.

  The first image is a still frame captured during a live video verification process. This is the ground truth.
  The second image is the profile picture the user wants to upload.

  Carefully analyze the facial features in both images (e.g., eyes, nose, mouth, jawline, facial structure).
  - If the faces belong to the same person, set isSamePerson to true.
  - If the faces belong to different people, or if a clear face cannot be detected in one or both images, set isSamePerson to false.
  - If you set isSamePerson to false, provide a brief, user-friendly reason. For example, "The face in your profile picture does not seem to match the face from your live verification." or "A clear face could not be detected in your profile picture."

  Live Verification Photo: {{media url=livePhotoDataUri}}
  Uploaded Profile Photo: {{media url=profilePhotoDataUri}}`,
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
