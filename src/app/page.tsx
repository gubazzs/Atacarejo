"use client";

import dynamic from "next/dynamic";

// carrega só no cliente (Nexo/ErrorBoundary tocam window -> sem SSR)
const AdminShell = dynamic(() => import("@/components/AdminShell"), {
  ssr: false,
});

export default function Page() {
  return <AdminShell />;
}
