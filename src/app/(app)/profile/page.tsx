// This file is now renamed to [id]/page.tsx.
// The content has been moved and adapted there.
// This file can be removed, but we are keeping it to avoid breaking changes if any other part of the system expects it.
import { redirect } from 'next/navigation';

export default function ProfileRedirectPage() {
  // Redirect to a default or the user's own profile page.
  // For this example, we'll redirect to the settings page.
  redirect('/profile/edit');
}
