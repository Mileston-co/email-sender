import { NextResponse } from 'next/server';
import { generateRedirectUrl } from '@/server/actions/email.action';

export async function GET() {

  const authUrl = await generateRedirectUrl();

  return NextResponse.redirect(authUrl);
}
