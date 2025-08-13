'use server';

import { getProfileImprovementSuggestions, type ProfileImprovementInput } from '@/ai/flows/profile-improvement-suggestions';

export async function suggestImprovements(input: ProfileImprovementInput) {
  try {
    const result = await getProfileImprovementSuggestions(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error getting profile improvement suggestions:', error);
    return { success: false, error: 'Profil önerileri alınırken bir hata oluştu.' };
  }
}
