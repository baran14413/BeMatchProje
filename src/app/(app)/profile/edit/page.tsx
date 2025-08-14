
'use client';

import { redirect } from 'next/navigation';

// Redirect to the personal settings page by default
export default function EditProfileRedirectPage() {
    redirect('/profile/edit/personal');
}
