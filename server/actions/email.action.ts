"use server";

import { Resend } from "resend";
import connectToDB from "../model/database";
import getSession from "../session/getSession.action";
import { EmailTemplate } from "@/components/shared/emailTemplate";
import Email from "../schemas/emails";
import { google } from 'googleapis';
import User from '@/server/schemas/user';
import Thread from "../schemas/threads";


interface EmailParams {
    message: string;
    to: string;
    subject: string;
    name?: string;
    email?: string;
}

export default async function sendEmail(params: EmailParams) {
    const resend = new Resend(process.env.RESEND_KEY);

    try {
        await connectToDB();
        const session = await getSession();

        if (!session || !session.userId) {
            throw new Error("Unauthorized to send emails!");
        }

        const senderName = params.name || `${session.firstName} ${session.lastName}`;
        const senderEmail = params.email || session.email;

        // Save the email to the database
        const emailRecord = new Email({
            message: params.message,
            user: session.userId,
        });

        await emailRecord.save();

        const { data, error } = await resend.emails.send({
            from: `${senderName} <${senderEmail}>`,
            to: [params.to],
            subject: params.subject,
            react: EmailTemplate({ message: params.message }),
        });

        if (error) {
            return { error: error.message };
        }

        // Save the sent email to the threads collection
        await saveSentEmailToThread({
            from: senderEmail as string,
            to: params.to,
            subject: params.subject,
            body: params.message,
        });

        return { message: `Email sent successfully to ${params.to}` };

    } catch (error: any) {
        console.error("An error occurred", error.message);
        return { error: error.message };
    }
}

// Function to save sent email to the thread
async function saveSentEmailToThread(emailData: { from: string; to: string; subject: string; body: string }) {
    const { from, to, subject, body } = emailData;

    // Check if there's an existing thread between these two participants
    const existingThread = await Thread.findOne({
        participants: { $all: [from, to] },
        subject,
    });

    const message = {
        sender: from,
        content: body,
        messageId: new Date().toISOString(), // Create a unique ID for this message
        timestamp: new Date(),
    };

    if (existingThread) {
        // If the thread exists, add the new message to it
        existingThread.messages.push(message);
        existingThread.lastUpdated = Date.now();
        await existingThread.save();
    } else {
        // Create a new thread including participants and subject
        const newThread = new Thread({
            participants: [from, to],
            subject,
            messages: [message],
            lastUpdated: Date.now(),
        });
        await newThread.save();
    }
}



export async function getOAuthClient(userId: string) {
    const user = await User.findById(userId);

    if (!user || !user.gmailToken) {
        throw new Error('No Gmail token found');
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/gmail/callback`
    );

    // Set current credentials
    oauth2Client.setCredentials({
        access_token: user.gmailToken.access_token,
        refresh_token: user.gmailToken.refresh_token,
        expiry_date: user.gmailToken.expiry_date,
    });

    // Check if the access token is expired
    if (Date.now() >= user.gmailToken.expiry_date) {
        console.log('Token expired, refreshing token...');

        // Automatically refresh the token
        const newTokens = await oauth2Client.refreshAccessToken();

        // Update the user's tokens in the database
        await User.findByIdAndUpdate(userId, {
            'gmailToken.access_token': newTokens.credentials.access_token,
            'gmailToken.expiry_date': newTokens.credentials.expiry_date,
        });

        oauth2Client.setCredentials({
            access_token: newTokens.credentials.access_token,
        });
    }

    return oauth2Client;
}

interface emailDataParams {
    from: string;
    to: string;
    subject: string;
    messageId: string;
    body: string;
}

export async function saveMessageToThread(emailData: emailDataParams) {
    const { from, to, subject, messageId, body } = emailData;

    // Check if there's an existing thread between these two participants
    const existingThread = await Thread.findOne({
        participants: { $all: [from, to] }, // Look for threads with both participants
        subject: subject, // Optional, but helps with filtering by subject line
    });

    const message = {
        sender: from,
        content: body,
        messageId,
        timestamp: new Date(), // Timestamp can come from the emailData as well
    };

    if (existingThread) {
        // If the thread exists, add the new message to it
        existingThread.messages.push(message);
        existingThread.lastUpdated = Date.now();
        await existingThread.save();
    } else {
        // Create a new thread
        const newThread = new Thread({
            participants: [from, to],
            subject,
            messages: [message],
            lastUpdated: Date.now(),
        });
        await newThread.save();
    }
}


export async function fetchAndSaveGmailThreads() {

    const session = await getSession();

    if (!session || !session.userId) {
        throw new Error("User is not authenticated!");
    }

    const oauth2Client = await getOAuthClient(session.userId)

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Fetch messages sent to tomiwa@mileston.co
    const response = await gmail.users.messages.list({
        userId: 'me',
        q: 'to:tomiwa@mileston.co',
    });

    // Check if messages are present
    const messages = response.data.messages || []; // Fallback to an empty array if undefined

    // Loop through each message and save to thread
    for (const message of messages) {
        const messageData = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
        });

        if(!messageData.data.payload) {
            throw new Error("No messages payload!")
        }

        const headers = messageData.data.payload.headers || [];

        // Using optional chaining to avoid accessing properties of undefined
        const from = headers.find(header => header.name === 'From')?.value || '';
        const to = headers.find(header => header.name === 'To')?.value || '';
        const subject = headers.find(header => header.name === 'Subject')?.value || '';
        const body = messageData.data.snippet || ''; // Snippet is a short preview of the email body

        // Create the email data object
        const emailData = {
            from,
            to,
            subject,
            messageId: messageData.data.id!,
            body,
        };

        // Save the email to the thread
        await saveMessageToThread(emailData);
    }
}