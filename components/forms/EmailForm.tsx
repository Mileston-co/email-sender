"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { StatusMessage } from "../shared/shared";
import { NoOutlineButtonBig } from "../shared/buttons";
import { signIn } from "@/server/actions/login.action";

const EmailForm = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isError, setIsError] = useState(false);
  const router = useRouter();

  const validateEmail = (email: any) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  async function handleSubmit(e: any) {
    e.preventDefault();
    if (validateEmail(email)) {
      setError("");
      setIsEmailSent(false);
      setIsError(false);
      setLoading(true);
      const response = await signIn(email);
      if (response) {
        setLoading(false);
        setIsEmailSent(true);
        router.replace("/auth/verify");
      } else {
        setLoading(false);
        setIsError(true);
      }
    } else {
      setError("Invalid email address. Please try again.");
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-10">
        <div>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full p-4 bg-[#131621] border-2 border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-[##E0E0E0] focus:border-[#E0E0E0] sm:text-sm placeholder-[#464D67]"
          />
          {error && (
            <span className="text-red-500 text-left text-sm">{error}</span>
          )}
        </div>
        <NoOutlineButtonBig
          type="submit"
          name="Continue with Email"
          loading={loading}
        />
      </form>
      {isEmailSent === true && (
        <StatusMessage type="success" message="Email sent successfully!" />
      )}
      {isError === true && (
        <StatusMessage type="error" message="Error sending email. Try again!" />
      )}
    </>
  );
};

export default EmailForm;