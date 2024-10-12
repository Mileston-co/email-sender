import type { Metadata } from "next";
import "../globals.css";
import { Card } from "@/components/shared/Cards";

export const metadata: Metadata = {
  title: "Auth",
  description: "Log in to your Mileston Email",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#0A0C13] text-white">
        <main className="h-screen flex items-center justify-center">
          <Card>{children}</Card>
        </main>
      </body>
    </html>
  );
}