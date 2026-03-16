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
        className="btn-secondary disabled:opacity-50"
      >
        {isPending ? "Redirection..." : "Gérer l'abonnement →"}
      </button>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </>
  );
}
