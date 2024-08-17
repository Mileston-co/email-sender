import { ReactNode } from "react";

interface CardProps {
    children: ReactNode;
  }
  
  export function Card({ children }: CardProps): JSX.Element {
    return (
      <div className="cards-bg border-2 border-[#23283A] p-10 min-w-[300px] max-w-[500px] min-h-[200px] flex items-center justify-center rounded-lg">
        {children}
      </div>
    );
  }
  
  interface CardProps2 extends CardProps {
    bgColor?: string;
  }
  
  export function Card2({ children, ...params }: CardProps2): JSX.Element {
    return (
      <div
        className={`border-2 border-[#23283A] p-10 rounded-3xl w-full`}
        style={{ backgroundColor: params?.bgColor || "#0e1018" }}
      >
        {children}
      </div>
    );
  }