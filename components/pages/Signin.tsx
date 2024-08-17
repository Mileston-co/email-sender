"use client";

import EmailForm from "@/components/forms/EmailForm";

export default function SignInPage() {

  return (
    <div className="text-center">
      <h1 className="font-bold text-[36px]">Sign to your Account</h1>
      <p className="font-regular text-[16px]">
        Enter your email address to continue to Mileston
      </p>
      <EmailForm />
      <p className="text-[16px] p-5 font-regular">
        By clicking continue, you agree to our{" "}
        <span className="text-[#263382]"> Terms of Service </span> and{" "}
        <span className="text-[#263382]"> Privacy Policy </span>
      </p>
    </div>
  );
}