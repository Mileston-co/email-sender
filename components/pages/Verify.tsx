"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { NoOutlineButtonBig } from "@/components/shared/buttons";
import { verifyUserTokenAndLogin } from "@/server/actions/login.action";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const [verifyResult, setVerifyResult] = useState(
    "Enter the code sent to your email below"
  );
  const [loading, setLoading] = useState(false);
  const [codes, setCodes] = useState(Array(5).fill(""));

  const handleVerify = async (code: string) => {
    try {
      setLoading(true);
      const result = await verifyUserTokenAndLogin(code);
      if (result.message !== undefined) {

        if (result.message === true) {
            setVerifyResult("You're verified. Please wait. Fetching Emails...");
          window.location.href = "/";
        } else {
          setVerifyResult(result.message as string);
        }
      } else if (result.error) {
        setVerifyResult(result.error);
        window.location.href = "/auth/signin";
      }
    } catch (error) {
      console.error("Error verifying token:", error);
      setVerifyResult("Error verifying token");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 1) {
      const newCodes = [...codes];
      newCodes[index] = value;
      setCodes(newCodes);
    }
  };

  const handleSubmit = () => {
    if (codes.every((code) => code !== "")) {
      const fullCode = codes.join("");
      handleVerify(fullCode);
    } else {
      setVerifyResult("Please fill in all code boxes.");
    }
  };

  return (
    <main className="text-center">
      <p className="text-center text-xl font-bold p-5 mb-10">{verifyResult}</p>

      <div className="flex justify-center gap-2 mb-4 text-black mb-10">
        {codes.map((code, index) => (
          <input
            key={index}
            type="text"
            maxLength={1}
            value={code}
            onChange={(e) => handleInputChange(e, index)}
            className="w-12 h-12 text-center text-xl border border-[#E0E0E0] rounded-lg bg-[#1B1F2E] text-white"
            style={{ flex: 1, margin: "0 5px" }}
          />
        ))}
      </div>

      <span onClick={handleSubmit}>
        <NoOutlineButtonBig
          type="button"
          name="Verify Me"
          disabled={loading}
          loading={loading}
        />
      </span>
    </main>
  );
}