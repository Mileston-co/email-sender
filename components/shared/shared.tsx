import Image from "next/image";
import { useEffect, useState } from "react";
import { FullModal } from "./modal";
import { fetchThreadById } from "@/server/actions/email.action";
import { format } from "date-fns";
import DOMPurify from 'dompurify';
import { NoOutlineButtonBig } from "../shared/buttons";
import MessageForm from "../forms/MessageForm";

interface StatusMessageProps {
  message: string;
  type: "error" | "success";
}

export const StatusMessage: React.FC<StatusMessageProps> = ({
  message,
  type,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 10000); // Message disappears after 10 seconds

    return () => clearTimeout(timer);
  }, []);

  const iconSrc =
    type === "error" ? "/assets/icons/problem.svg" : "/assets/icons/book.svg";

  return (
    <div
      className={`fixed top-5 right-5 p-3 rounded-md text-white flex items-center ${type === "error" ? "bg-[#E40686]" : "bg-[#5EE398]"
        } ${isVisible ? "opacity-100" : "opacity-0"
        } transition-opacity duration-300`}
    >
      <div className="flex-shrink-0 mr-3">
        <Image src={iconSrc} alt="Icon" width={24} height={24} />
      </div>
      <div>{message}</div>
    </div>
  );
};

export interface EmailSnippetProps {
  senderName: string;
  subject: string;
  snippet: string;
  timestamp: string;
  threadId: string;
  senderEmail: string;
}

export function EmailSnippetComp({ senderName, subject, snippet, timestamp, threadId, senderEmail }: EmailSnippetProps) {

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  }

  const handleCloseModal = () => {
    setIsModalOpen(false);
  }

  return (
    <>
      <div
        className="bg-[#0E1018] p-4 cursor-pointer rounded-lg text-white grid grid-cols-6 items-center justify-center gap-5"
        onClick={handleOpenModal}
      >
        <div className="col-span-5">
          <h1 className="font-bold text-[12px] lg:text-[16px]">{senderName}</h1>
          <p className="font-semibold text-[8px] lg:text-[14px]">{subject}</p>
          <p className="font-medium text-[7px] lg:text-[12px]">{snippet}</p>
        </div>
        <div className="col-span-1">
          <p className="font-light text-[8px] lg:text-[12px]">{timestamp}</p>
        </div>
      </div>
      <FullModal onClose={handleCloseModal} isOpen={isModalOpen}>
        <div className="">
          <h2 className="font-bold text-[20px] mb-10">{subject}</h2>
          <FullThreadsRender threadsId={threadId} subject={subject} to={senderEmail} />
        </div>
      </FullModal>
    </>
  )
}

export interface FullEmailCompProps {
  senderDetails: string;
  body: string;
  receiverEmail: string;
  timestamp: string;
  showBodyByDefault?: boolean; // Optional prop to specify if the body should be shown by default
}

export function FullEmailComp({ senderDetails, body, receiverEmail, timestamp, showBodyByDefault = false }: FullEmailCompProps) {
  const [isBodyVisible, setIsBodyVisible] = useState(showBodyByDefault);
  const cleanHTML = DOMPurify.sanitize(body);

  const toggleBodyVisibility = () => {
    setIsBodyVisible(prev => !prev);
  };

  return (
    <div className="p-4 cursor-pointer text-white grid grid-cols-6 gap-5 items-start justify-start border-b-2">
      <div className="col-span-5">
        <h1 className="font-bold text-[14px]">From: {senderDetails}</h1>
        <p className="font-semibold text-[14px] mb-7">To: {receiverEmail}</p>

        {isBodyVisible ? (
          <div onClick={toggleBodyVisibility}>
            <div dangerouslySetInnerHTML={{ __html: cleanHTML }} />
          </div>
        ) : (
          <button className="font-medium text-[13px] text-[#E40686]" onClick={toggleBodyVisibility}>
            ...
          </button>
        )}
      </div>
      <div className="col-span-1 justify-start">
        <p className="font-light text-[8px] lg:text-[12px]">{timestamp}</p>
      </div>

      {/* Toggle button for hiding and showing the body */}
      {/* {isBodyVisible && (
        <button className="text-[#E40686] mt-2" onClick={toggleBodyVisibility}>
          Hide
        </button>
      )} */}
    </div>
  );
}

export interface FullThreadsRenderProp {
  threadsId: string;
  subject?: string;
  to?: string;
}

export function FullThreadsRender({ threadsId, subject, to }: FullThreadsRenderProp) {
  const [threads, setThreads] = useState<FullEmailCompProps[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  }

  const handleCloseModal = () => {
    setIsModalOpen(false);
  }

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        setLoading(true);
        const data = await fetchThreadById(threadsId); // Call server action to fetch the thread

        // Sort the messages from oldest to newest based on the timestamp
        const sortedMessages = data.sort((a, b) => {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(); // Sort in ascending order
        });

        // Format the timestamps for rendering
        const formattedMessages = sortedMessages.map((message) => ({
          ...message,
          timestamp: formatTimestamp(message.timestamp), // Call your formatting function here
        }));

        setThreads(formattedMessages); // Update state with formatted messages
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchThreads(); // Call the fetch function when component mounts
  }, [threadsId]);

  // Helper function to format the timestamp for rendering
  const formatTimestamp = (date: string): string => {
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


  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <>
      <div>
        <div className="flex-col items-center justify-center gap-3 space-y-5">
          {threads.map((thread, index) => (
            <FullEmailComp
              key={index}
              senderDetails={thread.senderDetails}
              body={thread.body}
              receiverEmail={thread.receiverEmail}
              timestamp={thread.timestamp}
              showBodyByDefault={index === threads.length - 1} // Show body by default for the last message
            />
          ))}
        </div>
        <NoOutlineButtonBig name="Reply Email" type="button" onclick={handleOpenModal} />
      </div>
      <FullModal onClose={handleCloseModal} isOpen={isModalOpen}>
          <h1 className="text-[24px] md:text-[36px] font-bold text-left mb-10">
            Reply Email
          </h1>
          <div className="mt-10">
            <MessageForm subject={subject as string} to={to} />
          </div>
      </FullModal>
    </>
  );
}

