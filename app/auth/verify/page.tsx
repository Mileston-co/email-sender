"use client";

import VerifyPage from "@/components/pages/Verify";
import { Suspense } from "react";

export default function Verify() {
  return (
    <Suspense>
      <VerifyPage />
    </Suspense>
  );
}