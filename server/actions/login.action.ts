"use server";

import connectToDB from "../model/database";
import User from "../schemas/user";
import VerificationToken from "../schemas/verificationToken";
import { generateVerificationCode, saveSession, sendVerificationRequest } from "./utils";

export async function signIn(email: string) {
  console.log("I want to send emails");
  try {
    await connectToDB();

    // Generate code and timestamps for verification
    const { code, generatedAt, expiresIn } = generateVerificationCode();

    console.log(code);

    // Send email with resend.dev
    await sendVerificationRequest({ code, email });

    console.log("Email sent!");

    // Save email address, verification code, and expiration time in the database
    const save = await VerificationToken.create({
      token: code, // Use the generated code
      email,
      createdAt: generatedAt, // Since generated in the function, set current time
      expiresAt: expiresIn,
    });

    if (save) {
      console.log("saved code to DB");
    }

    // Return a response
    return true;
  } catch (error) {
    console.error("Error during sign-in:", error);
    return false;
  }
}

export async function verifyUserTokenAndLogin(code: string) {
  try {
    await connectToDB();

    const existingToken = await VerificationToken.findOne({ token: code });

    if (!existingToken) {
      console.log("Code not found in DB");
      return { error: "Invalid Credentials!" }; // Code not found in the database
    }

    const currentTime = new Date();
    if (currentTime > existingToken.expiresAt) {
      console.log("Code has expired");
      await VerificationToken.findOneAndDelete({ token: code });
      return { error: "Invalid code" }; // Code has expired
    }

    const email = existingToken.email;

    try {
      const existingUser = await User.findOne({ email });

      if (existingUser) {

        const sessionData = {
          userId: existingUser._id.toString(),
          email: existingUser.email,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          isGmailConnected: existingUser.gmailToken.access_token ? true : false,
          isLoggedIn: true,
        };

        // Save session
        await saveSession(sessionData);

        await VerificationToken.findOneAndDelete({ token: code });

        return {message: true};
      } else {
        
        return { message: "You are not authorized to use Mileston Email Sender" };
      }
    } catch (error: any) {
      console.error("Error logging user in", error.message);
      return { error: "Error logging in. Try again later!" };
    }
  } catch (error: any) {
    console.error("Error verifying code:", error.message);
    return { error: "Error verifying code. Try again later!" };
  }
}