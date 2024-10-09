"use client";

import { useState } from "react";

import { NoOutlineButtonBig, WriteButton } from "../shared/buttons";
import { FullModal } from "../shared/modal";
import MessageForm from "../forms/MessageForm";
import { Card2 } from "../shared/Cards";
import { useSession } from "../shared/session";
import Link from "next/link";

export default function HomePage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const session = useSession();

    const handleOpenModal = () => {
        setIsModalOpen(true);
    }

    const handleCloseModal = () => {
        setIsModalOpen(false);
    }

    // const handleRedirect = () => {
    //     await fetch("/api/google-auth/redirect-url")
    // }
    return (
        <>
            <div className="">
                <div className="grid grid-cols-2 items-center gap-10 p-10 bg-[#131621] rounded-3xl">
                    <h1 className="font-bold text-[32px] col-span-1">
                        Welcome, {session?.firstName}
                    </h1>
                    <Link href={"/api/google-auth/redirect-uri"}>
                        <NoOutlineButtonBig name="Connect Gmail" type="button" />
                    </Link>
                </div>
            </div>
            <WriteButton onClick={handleOpenModal} />
            <FullModal onClose={handleCloseModal} isOpen={isModalOpen}>
                <Card2>
                    <h1 className="text-[24px] md:text-[36px] font-bold text-center mb-10">Send Emails with Mileston Email Sender</h1>
                    <div className="mt-10">
                        <MessageForm />
                    </div>
                </Card2>
            </FullModal>
        </>
    )
}