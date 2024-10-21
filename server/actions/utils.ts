import { Resend } from "resend";
import { SessionData } from "../session/session";
import getSession from "../session/getSession.action";
import crypto from "crypto";

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
  existingSession.isGmailConnected = session.isGmailConnected;
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

// Define constants for PBKDF2
const SALT_LENGTH = 16; // Salt length in bytes
const KEY_LENGTH = 32; // AES-256 requires a 32-byte key
const ITERATIONS = 100000; // Number of iterations for PBKDF2
const DIGEST = 'sha256'; // Hash algorithm for PBKDF2

// Function to derive an encryption key using PBKDF2
function deriveKey(password: string, salt: string) {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);
}

// Function to generate a random salt
function generateSalt() {
  return crypto.randomBytes(SALT_LENGTH).toString('hex');
}

// Encryption function
export function encrypt(text: string, password: string) {
  const salt = generateSalt(); // Generate a salt for PBKDF2
  const iv = crypto.randomBytes(16); // Initialization vector for AES
  const key = deriveKey(password, salt); // Derive the key using PBKDF2

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf-8', 'hex');
  encrypted += cipher.final('hex');

  return {
    iv: iv.toString('hex'),
    salt, // Save salt for decryption
    encryptedData: encrypted,
  };
}

// Decryption function
export function decrypt(encryptedData: string, ivHex: string, salt: string, password: string) {
  const ivBuffer = Buffer.from(ivHex, 'hex');
  const key = deriveKey(password, salt); // Derive the key using the same salt

  const decipher = crypto.createDecipheriv('aes-256-cbc', key
  , ivBuffer);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');

  return decrypted;
}


export function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // Client-side: Use window.location.origin when in the browser
    return window.location.origin;
  }

  // Server-side: Use environment variables for production, preview, or localhost
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
    // If you're in production on Vercel
    return `https://sendemail.mileston.co`;
  }

  if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') {
    // If you're in preview on Vercel
    return `https://${process.env.VERCEL_URL}`;
  }

  // For local development (default)
  return 'http://localhost:3000';
}