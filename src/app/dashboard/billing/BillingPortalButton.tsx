// src/app/dashboard/billing/BillingPortalButton.tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function BillingPortalButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) router.push(data.url);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="btn-secondary disabled:opacity-50"
    >
      {isPending ? "Redirection..." : "Gérer l'abonnement →"}
    </button>
  );
}
