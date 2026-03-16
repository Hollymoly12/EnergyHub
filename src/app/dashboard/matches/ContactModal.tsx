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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl border border-black/5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-primary text-lg font-display">Contacter</h2>
            <p className="text-sm text-slate-500">{targetOrgName}</p>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full flex items-center justify-center text-slate-400 hover:text-primary hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-primary/60 mb-2">Message</label>
            <textarea
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm min-h-[120px] resize-none outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Présentez-vous et expliquez l'objet de votre prise de contact..."
              required
              minLength={10}
              autoFocus
            />
            <p className="text-[10px] text-slate-400 mt-1">{message.length} / 10 min</p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-bold border transition-colors hover:bg-slate-50"
              style={{ borderColor: "#16523A", color: "#16523A" }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending || message.trim().length < 10}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#16523A" }}
            >
              <span className="material-symbols-outlined text-base">send</span>
              {isPending ? "Envoi..." : "Envoyer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
