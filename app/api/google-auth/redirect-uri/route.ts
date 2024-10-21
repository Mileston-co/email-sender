import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getBaseUrl } from '@/server/actions/utils';

export async function GET() {
  const url = getBaseUrl();
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${url}/api/google-auth/callback`
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
  });

  return NextResponse.redirect(authUrl);
}
