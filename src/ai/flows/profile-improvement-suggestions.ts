'use server';

/**
 * @fileOverview AI-powered profile improvement suggestions.
 *
 * - getProfileImprovementSuggestions - A function that generates profile improvement suggestions.
 * - ProfileImprovementInput - The input type for the getProfileImprovementSuggestions function.
 * - ProfileImprovementOutput - The return type for the getProfileImprovementSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProfileImprovementInputSchema = z.object({
  profileText: z.string().describe('The user profile text to be improved.'),
  interests: z.string().describe('A comma separated list of the users interests'),
});
export type ProfileImprovementInput = z.infer<typeof ProfileImprovementInputSchema>;

const ProfileImprovementOutputSchema = z.object({
  improvedProfile: z.string().describe('The improved user profile text.'),
  icebreakerSuggestions: z
    .array(z.string())
    .describe('Suggestions for icebreakers based on common interests.'),
});
export type ProfileImprovementOutput = z.infer<typeof ProfileImprovementOutputSchema>;

export async function getProfileImprovementSuggestions(
  input: ProfileImprovementInput
): Promise<ProfileImprovementOutput> {
  return profileImprovementFlow(input);
}

const profileImprovementPrompt = ai.definePrompt({
  name: 'profileImprovementPrompt',
  input: {schema: ProfileImprovementInputSchema},
  output: {schema: ProfileImprovementOutputSchema},
  prompt: `You are an AI assistant designed to help users improve their dating profiles.

  Given the user's current profile text and a list of their interests, suggest improvements to make the profile more attractive and engaging. Also, suggest icebreaker questions based on the user's interests that they can use to start conversations with potential matches.

  Profile Text: {{{profileText}}}
  Interests: {{{interests}}}

  Improved Profile and Icebreaker Suggestions:
  `,
});

const profileImprovementFlow = ai.defineFlow(
  {
    name: 'profileImprovementFlow',
    inputSchema: ProfileImprovementInputSchema,
    outputSchema: ProfileImprovementOutputSchema,
  },
  async input => {
    const {output} = await profileImprovementPrompt(input);
    return output!;
  }
);
