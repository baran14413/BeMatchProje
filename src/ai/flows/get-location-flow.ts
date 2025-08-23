
'use server';
/**
 * @fileOverview An AI flow for converting geographic coordinates to a human-readable address.
 *
 * - getLocationFromCoordinates - Takes latitude and longitude and returns a formatted address.
 * - GetLocationInput - The input type for the getLocationFromCoordinates function.
 * - GetLocationOutput - The return type for the getLocationFromCoordinates function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getLocation } from '@/services/location-service';

const GetLocationInputSchema = z.object({
  latitude: z.number().describe('The latitude of the location.'),
  longitude: z.number().describe('The longitude of the location.'),
});
export type GetLocationInput = z.infer<typeof GetLocationInputSchema>;

const GetLocationOutputSchema = z.object({
  address: z
    .string()
    .optional()
    .describe('The formatted address (e.g., "City, District").'),
  error: z
    .string()
    .optional()
    .describe('An error message if the location could not be determined.'),
});
export type GetLocationOutput = z.infer<typeof GetLocationOutputSchema>;

const getLocationFlow = ai.defineFlow(
  {
    name: 'getLocationFlow',
    inputSchema: GetLocationInputSchema,
    outputSchema: GetLocationOutputSchema,
  },
  async ({ latitude, longitude }) => {
    try {
      const address = await getLocation(latitude, longitude);
      return { address };
    } catch (e: any) {
      console.error('Get location flow failed', e);
      return {
        error:
          'Konum bilgisi alınamadı. Lütfen daha sonra tekrar deneyin.',
      };
    }
  }
);


export async function getLocationFromCoordinates(
  input: GetLocationInput
): Promise<GetLocationOutput> {
  return getLocationFlow(input);
}
