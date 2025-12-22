"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const ComplianceContent = dynamic(() => import("./compliance-content"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[80vh] flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
});

export default function CompliancePage() {
  return <ComplianceContent />;
}
