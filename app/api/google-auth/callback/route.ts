import connectToDB from '@/server/model/database';
import User from '@/server/schemas/user';
import getSession from '@/server/session/getSession.action';
import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No code provided' });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/google-auth/callback`
  );

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  await connectToDB();

  const session = await getSession();
  const userId = session.userId;

  // Store tokens securely
  const user = await User.findByIdAndUpdate(
    userId,
    {
      gmailToken: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token, // Only present on first authorization
        scope: tokens.scope,
        token_type: tokens.token_type,
        expiry_date: tokens.expiry_date,
      },
    },
    { new: true }
  );

  if (!user) {
    return NextResponse.json({ error: 'User not found' });
  }

  return NextResponse.redirect(new URL("/", req.url));
}

