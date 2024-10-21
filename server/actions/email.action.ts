"use server";

import { Resend } from "resend";
import connectToDB from "../model/database";
import getSession from "../session/getSession.action";
import { EmailTemplate } from "@/components/shared/emailTemplate";
import Email from "../schemas/emails";
import { google } from 'googleapis';
import { format } from 'date-fns';
import User from '@/server/schemas/user';
import Thread from "../schemas/threads";
import { EmailSnippetProps, FullEmailCompProps } from "@/components/shared/shared";
import { getBaseUrl } from "./utils";


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
            user: session.userId,
        });

        return { message: `Email sent successfully to ${params.to}` };

    } catch (error: any) {
        console.error("An error occurred", error.message);
        return { error: error.message };
    }
}

// Function to save sent email to the thread
async function saveSentEmailToThread(emailData: { from: string; to: string; subject: string; body: string; user: string }) {
    const { from, to, subject, body, user } = emailData;

    // Create regex patterns for matching participants
    const fromRegex = new RegExp(`.*<${from}>|^${from}$`, 'i'); // For `from` email
    const toRegex = new RegExp(`.*<${to}>|^${to}$`, 'i');

    // Check if there's an existing thread between these two participants
    const existingThread = await Thread.findOne({
        $and: [
            { participants: { $elemMatch: { $regex: fromRegex } } },
            { participants: { $elemMatch: { $regex: toRegex } } }
        ]
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
            user,
        });
        await newThread.save();
    }
}



export async function getOAuthClient(userId: string) {
    const user = await User.findById(userId);

    if (!user || !user.gmailToken) {
        throw new Error('No Gmail token found');
    }
    const url = getBaseUrl();
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${url}/api/auth/gmail/callback`
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
    snippet?: string;
    internalDate?: string; // Adding internalDate for Gmail's timestamp
}

export async function saveMessageToThread(emailData: emailDataParams) {
    const { from, to, subject, messageId, body, internalDate, snippet } = emailData;

    const session = await getSession();

    if (!session || !session.userId) {
        throw new Error("User is not authenticated!");
    }

    // Check if there's an existing thread between these two participants
    const existingThread = await Thread.findOne({
        participants: { $all: [from, to] },
    });

    // Convert internalDate to a readable date, if provided
    const timestamp = internalDate;

    const message = {
        sender: from,
        content: body,
        snippet,
        messageId,
        timestamp, // Use the converted internalDate or default to the current date
    };

    if (existingThread) {
        // Check if the message already exists in the thread to avoid duplicates
        const messageExists = existingThread.messages.some((msg: { messageId: string }) => msg.messageId === messageId);

        if (!messageExists) {
            // Add the new message if it doesn't exist
            existingThread.messages.push(message);
            existingThread.lastUpdated = Date.now();
            await existingThread.save();
        }
    } else {
        // Create a new thread
        const newThread = new Thread({
            participants: [from, to],
            subject,
            messages: [message],
            lastUpdated: Date.now(),
            user: session.userId,
        });
        await newThread.save();
    }
}


export async function fetchAndSaveGmailThreads() {
    await connectToDB();

    const session = await getSession();

    if (!session || !session.userId) {
        throw new Error("User is not authenticated!");
    }

    const oauth2Client = await getOAuthClient(session.userId);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Fetch messages sent to the user's email, limit to 20 messages as an example
    const response = await gmail.users.messages.list({
        userId: 'me',
        q: session.email,
        maxResults: 100,  // Add a limit to the number of emails to process
    });

    const messages = response.data.messages || []; // Fallback to an empty array if undefined

    // Fetch and save all messages in parallel
    await Promise.all(messages.map(async (message) => {
        const messageData = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
            format: 'full',
        });

        if (!messageData.data.payload) {
            throw new Error("No message payload!");
        }

        const headers = messageData.data.payload.headers || [];
        const from = headers.find(header => header.name === 'From')?.value || '';
        const to = headers.find(header => header.name === 'To')?.value || '';
        const subject = headers.find(header => header.name === 'Subject')?.value || '';
        const snippet = messageData.data.snippet || 'No snippet provided';
        const internalDate = messageData.data.internalDate || '';

        let body = '';

        if (messageData.data.payload.parts) {
            const parts = messageData.data.payload.parts;

            for (const part of parts) {
                if (part.mimeType === 'text/plain' && part.body?.data) {
                    body = Buffer.from(part.body.data, 'base64').toString('utf8');
                } else if (part.mimeType === 'text/html' && part.body?.data) {
                    body = Buffer.from(part.body.data, 'base64').toString('utf8');
                }
            }
        } else if (messageData.data.payload.body?.data) {
            body = Buffer.from(messageData.data.payload.body.data, 'base64').toString('utf8');
        }

        const emailData = {
            from,
            to,
            subject,
            messageId: messageData.data.id!,
            snippet,
            body: body || 'No body available',
            internalDate: new Date(parseInt(internalDate)).toISOString(),
        };

        // Save message to thread in parallel
        await saveMessageToThread(emailData);
    }));
}



export async function fetchEmailSnippets(): Promise<EmailSnippetProps[]> {
    try {
        await connectToDB();
        const session = await getSession();

        if (!session || !session.userId) {
            throw new Error("User is not authenticated!");
        }

        const userId = session.userId;

        // Fetch threads that belong to the user, sorted by latest updated thread first
        const threads = await Thread.find({ user: userId })
            .sort({ lastUpdated: -1 }) // Sort threads by lastUpdated (newest first)
            .populate('user')
            .lean();

        // Helper function to format the timestamp
        const formatTimestamp = (date: Date): string => {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);

            const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
            const isYesterday = format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd');

            if (isToday) {
                return format(date, 'HH:mm'); // Show only the time for today's emails
            } else if (isYesterday) {
                return 'Yesterday';
            } else {
                return format(date, 'MM-dd-yyyy'); // Show the date (e.g., 08-06-2024) for older emails
            }
        };

        // Map through each thread and format the result
        const emailSnippets: EmailSnippetProps[] = threads.map(thread => {
            // Extract the latest message
            const latestMessage = thread.messages[thread.messages.length - 1];

            // Extract the sender's email from the sender field
            const senderEmailMatch = latestMessage.sender.match(/<(.+?)>/); // Extract email within angle brackets
            const senderEmail = senderEmailMatch ? senderEmailMatch[1] : 'Unknown Email'; // Use matched email or default

            // Extract the senderName by filtering out "mileston.co" emails
            const senderName = senderEmail ? senderEmail.split('@')[0] : 'Unknown Sender'; // Optionally extract name from email

            // Format and return the snippet
            return {
                senderName,
                senderEmail, // Include senderEmail in the returned object
                subject: thread.subject || 'No Subject',
                snippet: latestMessage.snippet || latestMessage.content.substring(0, 100) + '...', // Fallback to content if snippet is missing
                timestamp: formatTimestamp(new Date(latestMessage.timestamp)), // Format the timestamp using the helper function
                threadId: thread._id?.toString() || '',
            };
        });

        return emailSnippets;
    } catch (error) {
        console.error('Error fetching email snippets:', error);
        throw new Error('Failed to fetch email snippets');
    }
}


// Server action function to fetch a thread by its ID
export async function fetchThreadById(threadId: string): Promise<FullEmailCompProps[]> {
    try {
        const session = await getSession();

        const thread = await Thread.findById(threadId).exec();
        if (!thread) {
            throw new Error(`Thread with ID ${threadId} not found`);
        }

        // Map and format the messages
        const threadMessages: FullEmailCompProps[] = thread.messages.map(({ sender, content, snippet, timestamp }: { sender: string, content: string, snippet: string, timestamp: string }) => {

            return {
                senderDetails: sender === session?.email ? 'You' : sender,
                body: content || snippet || '',
                receiverEmail: (() => {
                    // If the sender is the session email, check participants[1]
                    if (sender === session?.email) {
                        // Check if participants[1] is the same as session email, then fallback to participants[0]
                        return thread.participants[1] === session?.email ? thread.participants[0] : thread.participants[1];
                    }
                    // Otherwise, fallback to session email
                    return session?.email;
                })(),
                timestamp: new Date(timestamp), // Store as a Date object for easy sorting
            };
        });

        return threadMessages; // Return the raw messages
    } catch (error: any) {
        throw new Error(`Error fetching thread: ${error.message}`);
    }
}

