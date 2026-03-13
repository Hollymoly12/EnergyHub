// src/app/investment/[id]/InterestButton.tsx
"use client";

import { useState, useTransition } from "react";

interface Props {
  dealId: string;
  requiresNda: boolean;
  alreadyExpressed: boolean;
}

export default function InterestButton({ dealId, requiresNda, alreadyExpressed }: Props) {
  const [modal, setModal] = useState(false);
  const [ndaChecked, setNdaChecked] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (alreadyExpressed || success) {
    return (
      <button disabled className="btn-primary opacity-60 cursor-default w-full">
        Intérêt déjà exprimé
      </button>
    );
  }

  function handleConfirm() {
    if (requiresNda && !ndaChecked) {
      setError("Vous devez accepter les conditions de confidentialité.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/deal-interests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dealId,
            ndaSigned: requiresNda ? ndaChecked : false,
            message: message.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur");
        setSuccess(true);
        setModal(false);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <>
      <button onClick={() => { setModal(true); setError(null); }} className="btn-primary w-full">
        Exprimer mon intérêt
      </button>

      {modal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !isPending && setModal(false)}
        >
          <div
            className="card p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-white mb-2">Exprimer mon intérêt</h2>
            <p className="text-slate-400 text-sm mb-6">
              Votre intérêt sera transmis au porteur du projet.
            </p>

            {requiresNda && (
              <label className="flex gap-3 items-start mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ndaChecked}
                  onChange={(e) => setNdaChecked(e.target.checked)}
                  className="mt-0.5 accent-yellow-500"
                  disabled={isPending}
                />
                <span className="text-slate-300 text-sm">
                  Je m&apos;engage à respecter la confidentialité de ce dossier et à ne pas divulguer les informations partagées à des tiers.
                </span>
              </label>
            )}

            <div className="mb-4">
              <label className="label">Message (optionnel)</label>
              <textarea
                className="input w-full resize-none"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isPending}
                placeholder="Présentez brièvement votre profil ou vos questions..."
              />
            </div>

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setModal(false)}
                disabled={isPending}
                className="btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending || (requiresNda && !ndaChecked)}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {isPending ? "Envoi..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
