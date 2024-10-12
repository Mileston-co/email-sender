import HomePage from "@/components/pages/Home";
import { fetchAndSaveGmailThreads } from "@/server/actions/email.action";
import getSession from "@/server/session/getSession.action";

export default async function Home() {
  const session = await getSession(); 
  if (session.isGmailConnected) await fetchAndSaveGmailThreads();
  return (
    <main className="">
      <HomePage />
    </main>
  );
}
