/**
 * @fileoverview This file initializes and configures the Genkit AI library.
 * It sets up the necessary plugins, in this case, the Google AI plugin for generative models.
 * It exports a configured `ai` object that can be used throughout the application to define
 * and run AI flows, prompts, and tools.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {firebase} from "firebase-admin/lib/firebase-namespace-api";
import App = firebase.app.App;

import { moderateImage } from './flows/moderate-image-flow';
import { verifyFace } from './flows/verify-face-flow';

export const ai = genkit({
  plugins: [
    googleAI({
      // The Gemini API key is currently read from the `GEMINI_API_KEY`
      // environment variable.
    }),
  ],
  flows: [moderateImage, verifyFace],
});
