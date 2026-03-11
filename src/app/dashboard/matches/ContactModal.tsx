"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Props {
  targetOrgId: string;
  targetOrgName: string;
  onClose: () => void;
}

export default function ContactModal({ targetOrgId, targetOrgName, onClose }: Props) {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 10) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create_conversation",
            targetOrgId,
            firstMessage: message.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur");
        router.push(`/dashboard/messages?conv=${data.conversationId}`);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Contacter {targetOrgName}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-lg">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Message</label>
            <textarea
              className="input min-h-[100px] resize-none"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Présentez-vous et expliquez l'objet de votre prise de contact..."
              required
              minLength={10}
              autoFocus
            />
            <p className="text-[10px] text-slate-600 mt-1">{message.length} / 10 min</p>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending || message.trim().length < 10}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {isPending ? "Envoi..." : "Envoyer →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
