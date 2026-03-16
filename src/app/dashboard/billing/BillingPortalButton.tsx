// src/app/dashboard/billing/BillingPortalButton.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function BillingPortalButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError("Impossible d'accéder au portail. Veuillez réessayer.");
        return;
      }
      router.push(data.url);
    });
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border transition-colors hover:bg-slate-50 disabled:opacity-50"
        style={{ borderColor: "#16523A", color: "#16523A" }}
      >
        <span className="material-symbols-outlined text-base">receipt_long</span>
        {isPending ? "Redirection..." : "Gérer l'abonnement"}
      </button>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </>
  );
}
