import Image from "next/image";
import { useEffect, useState } from "react";

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
  