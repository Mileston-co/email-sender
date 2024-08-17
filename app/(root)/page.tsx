import MessageForm from "@/components/forms/MessageForm";
import { Card, Card2 } from "@/components/shared/Cards";

export default function Home() {
  return (
    <main className="">
      <Card2>
        <h1 className="text-[24px] md:text-[36px] font-bold text-center mb-10">Send Emails with Mileston Email Sender</h1>
        <div className="mt-10">
          <MessageForm />
        </div>
      </Card2>
    </main>
  );
}
