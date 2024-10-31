"use client";

import { useState, useEffect } from "react";
import { NoOutlineButtonBig, WriteButton } from "../shared/buttons";
import { FullModal } from "../shared/modal";
import MessageForm from "../forms/MessageForm";
import { Card2 } from "../shared/Cards";
import { useSession } from "../shared/session";
import Link from "next/link";
import { EmailSnippetComp, EmailSnippetProps } from "../shared/shared";
import { fetchEmailSnippets, generateRedirectUrl } from "@/server/actions/email.action";
import { useRouter } from "next/navigation";

export default function HomePage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [emailSnippets, setEmailSnippets] = useState<EmailSnippetProps[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const session = useSession();

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleGoogleConnect = async () => {
        const url = await generateRedirectUrl();
        router.push(url);
    }

    useEffect(() => {
        const fetchSnippets = async () => {
            if (session?.isGmailConnected) {
                setLoading(true);
                try {
                    const snippets = await fetchEmailSnippets();

                    // Sort the snippets by timestamp (newest first)
                    const sortedSnippets = snippets.sort((a, b) => {
                        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                    });

                    console.log(sortedSnippets);

                    setEmailSnippets(sortedSnippets);
                } catch (err: any) {
                    setError("Failed to load email snippets");
                } finally {
                    setLoading(false);
                }
            }
        };

        // Call fetchSnippets initially on mount
        fetchSnippets();

    }, [session?.userId, session?.isGmailConnected]);
    // 1 minute = 60,000 milliseconds

    return (
        <>
            <div className="">
                <div className="grid grid-cols-2 items-center gap-10 p-5 lg:p-10 bg-[#131621] rounded-3xl">
                    <h1 className="font-bold text-[20px] lg:text-[32px] col-span-1">
                        Welcome, {session?.firstName}
                    </h1>

                    {/* Check if Gmail is connected */}
                    {session?.isGmailConnected ? (
                        <NoOutlineButtonBig name="Email Connected" type="button" disabled />
                    ) : (
                        <NoOutlineButtonBig name="Connect Gmail" type="button" onclick={handleGoogleConnect} />
                    )}
                </div>
            </div>

            {/* Email Snippets Section */}
            <div className="mt-10">
                {loading ? (
                    <p className="text-center">Loading emails...</p>
                ) : error ? (
                    <p className="text-center text-red-500">{error}</p>
                ) : session?.isGmailConnected ? (
                    <div className="flex-col items-center justify-center gap-6 space-y-3 mt-14 rounded-3xl bg-[#131621] p-4 lg:p-10">
                        {emailSnippets.length > 0 ? (
                            emailSnippets.map((snippet) => (
                                <EmailSnippetComp
                                    key={snippet.threadId}
                                    senderName={snippet.senderName}
                                    subject={snippet.subject}
                                    snippet={snippet.snippet}
                                    timestamp={snippet.timestamp}
                                    threadId={snippet.threadId}
                                    senderEmail={snippet.senderEmail}
                                />
                            ))
                        ) : (
                            <p className="text-center">No emails available.</p>
                        )}
                    </div>
                ) : (
                    <p className="text-center mt-10">Please connect your Gmail account to view your emails.</p>
                )}
            </div>

            <WriteButton onClick={handleOpenModal} />
            <FullModal onClose={handleCloseModal} isOpen={isModalOpen}>
                <Card2>
                    <h1 className="text-[24px] md:text-[36px] font-bold text-center mb-10">
                        Send Emails with Mileston Email Sender
                    </h1>
                    <div className="mt-10">
                        <MessageForm />
                    </div>
                </Card2>
            </FullModal>
        </>
    );
}
