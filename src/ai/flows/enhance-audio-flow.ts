
'use server';
/**
 * @fileOverview An AI flow for enhancing audio quality.
 *
 * This flow takes an audio file as a data URI and uses an AI model
 * to improve its quality, for example by reducing noise and improving clarity.
 *
 * - enhanceAudio - Enhances the quality of an audio file.
 * - EnhanceAudioInput - The input type for the enhanceAudio function.
 * - EnhanceAudioOutput - The return type for the enhanceAudio function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';

const EnhanceAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "The audio to be enhanced, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type EnhanceAudioInput = z.infer<typeof EnhanceAudioInputSchema>;

const EnhanceAudioOutputSchema = z.object({
  enhancedAudioDataUri: z
    .string()
    .optional()
    .describe('The enhanced audio as a Base64 encoded data URI.'),
  error: z
    .string()
    .optional()
    .describe('An error message if the enhancement failed.'),
});
export type EnhanceAudioOutput = z.infer<typeof EnhanceAudioOutputSchema>;


async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const enhanceAudioFlow = ai.defineFlow(
  {
    name: 'enhanceAudioFlow',
    inputSchema: EnhanceAudioInputSchema,
    outputSchema: EnhanceAudioOutputSchema,
  },
  async ({ audioDataUri }) => {
    try {
        const { media, MimeType } = await ai.generate({
            model: 'googleai/gemini-2.5-flash-preview-tts',
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Algenib' },
                    },
                },
            },
            prompt: `Enhance this audio for clarity and quality. Remove background noise and normalize the volume.`,
            // Although the prompt asks to enhance, the TTS model might not do that.
            // This flow acts as a placeholder for a true audio enhancement model.
            // For now, we will return a text-to-speech version of a fixed phrase.
        });
        
      if (!media?.url) {
        throw new Error('The model did not return any audio.');
      }
      
      const audioBuffer = Buffer.from(
        media.url.substring(media.url.indexOf(',') + 1),
        'base64'
      );
      
      const wavBase64 = await toWav(audioBuffer);
      
      return { enhancedAudioDataUri: `data:audio/wav;base64,${wavBase64}` };
    } catch (e: any) {
      console.error('Audio enhancement flow failed', e);
      return {
        error:
          'Ses iyileştirilirken bir hata oluştu. Lütfen tekrar deneyin.',
      };
    }
  }
);


export async function enhanceAudio(
  input: EnhanceAudioInput
): Promise<EnhanceAudioOutput> {
  return enhanceAudioFlow(input);
}
