"use server";

import { Resend } from "resend";
import connectToDB from "../model/database";
import getSession from "../session/getSession.action";
import { EmailTemplate } from "@/components/shared/emailTemplate";
import Email from "../schemas/emails";

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

        return { message: `Email sent successfully to ${params.to}` };

    } catch (error: any) {
        console.error("An error occurred", error.message);
        return { error: error.message };
    }
}
