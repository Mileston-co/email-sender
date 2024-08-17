import { Resend } from "resend";
import { SessionData } from "../session/session";
import getSession from "../session/getSession.action";

interface SendVerificationRequestParams {
  code: string;
  email: string;
}

export const sendVerificationRequest = async (
  params: SendVerificationRequestParams,
) => {
  try {
    const resendKey = process.env.RESEND_KEY;
    if (!resendKey) {
      throw new Error("RESEND_KEY is not defined in environment variables");
    }

    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: "onboarding@mileston.co",
      to: params.email,
      subject: "Login Link to your Account",
      html: `<p>Copy the below code to sign in to your account:</p>
             <p>${params.code}</p>`,
    });
  } catch (error: any) {
    console.error("Error sending verification request:", error.message);
  }
};



export async function saveSession(session: SessionData): Promise<void> {
  // Check if session exists
  let existingSession = await getSession();

  // Assign session properties
  existingSession.userId = session.userId;
  existingSession.email = session.email;
  existingSession.firstName = session.firstName;
  existingSession.lastName = session.lastName;
  existingSession.isLoggedIn = session.isLoggedIn;

  // Save the session
  await existingSession.save();
}

export function generateVerificationCode(): {
  code: string;
  generatedAt: Date;
  expiresIn: Date;
} {
  // Generate 5 random numbers
  const code = Array.from({ length: 5 }, () =>
    Math.floor(Math.random() * 10),
  ).join("");

  // Current time
  const generatedAt = new Date();

  // 5 minutes expiration
  const expiresIn = new Date(generatedAt.getTime() + 5 * 60 * 1000);

  return { code, generatedAt, expiresIn };
}