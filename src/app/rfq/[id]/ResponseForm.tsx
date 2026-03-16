"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { submitResponse } from "./actions";

interface ExistingResponse {
  message: string;
  price_range: string | null;
  delivery_timeline: string | null;
  submitted_at: string;
}

interface Props {
  rfqId: string;
  isLoggedIn: boolean;
  isOpen: boolean;
  isLimitReached: boolean;
  existingResponse: ExistingResponse | null;
}

const inputClass = "w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all";

export default function ResponseForm({ rfqId, isLoggedIn, isOpen, isLimitReached, existingResponse }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [deliveryTimeline, setDeliveryTimeline] = useState("");
  const [submittedData, setSubmittedData] = useState<{ message: string; priceRange: string; deliveryTimeline: string } | null>(null);

  if (!isLoggedIn) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-black/5 text-center">
        <p className="text-slate-500 mb-6">Connectez-vous pour répondre à cet appel d'offres</p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#16523A" }}
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border transition-colors hover:bg-slate-50"
            style={{ borderColor: "#16523A", color: "#16523A" }}
          >
            S'inscrire
          </Link>
        </div>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-black/5 text-center text-slate-500">
        <span className="material-symbols-outlined text-4xl text-slate-300 block mb-3">lock</span>
        <p>Cet appel d'offres n'accepte plus de réponses.</p>
      </div>
    );
  }

  if (existingResponse || success) {
    const resp = existingResponse;
    const displayData = resp || (submittedData ? {
      message: submittedData.message,
      price_range: submittedData.priceRange || null,
      delivery_timeline: submittedData.deliveryTimeline || null,
      submitted_at: new Date().toISOString(),
    } : null);
    return (
      <div className="bg-white rounded-3xl p-8 border border-green-200">
        <div className="flex items-center gap-3 mb-5">
          <div className="size-10 rounded-full bg-accent flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-base">check</span>
          </div>
          <span className="font-bold text-primary font-display">
            {success ? "Réponse soumise avec succès !" : "Vous avez déjà répondu"}
          </span>
        </div>
        {displayData && (
          <div className="space-y-3 text-sm text-slate-600">
            <p className="leading-relaxed">{displayData.message}</p>
            {displayData.price_range && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary/50 text-base">payments</span>
                <span>{displayData.price_range}</span>
              </div>
            )}
            {displayData.delivery_timeline && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary/50 text-base">calendar_today</span>
                <span>{displayData.delivery_timeline}</span>
              </div>
            )}
            <p className="text-[11px] text-slate-400">
              Soumis le {new Date(displayData.submitted_at).toLocaleDateString("fr-BE")}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (isLimitReached) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-accent/30">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-accent text-base">info</span>
          <p className="font-bold text-primary text-sm">Limite mensuelle atteinte</p>
        </div>
        <p className="text-slate-500 text-sm mb-5">
          Le plan Starter permet 1 réponse par mois. Passez au Pro pour répondre sans limite.
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#16523A" }}
        >
          <span className="material-symbols-outlined text-base">upgrade</span>
          Voir les offres Pro
        </Link>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await submitResponse(rfqId, {
          message,
          price_range: priceRange || undefined,
          delivery_timeline: deliveryTimeline || undefined,
        });
        setSubmittedData({ message, priceRange, deliveryTimeline });
        setSuccess(true);
      } catch (err) {
        const msg = (err as Error).message;
        if (msg === "LIMIT_REACHED") {
          setError("Limite mensuelle atteinte. Passez au Pro pour répondre sans limite.");
        } else {
          setError(msg);
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 border border-black/5 space-y-5">
      <h3 className="font-bold text-primary text-lg font-display">Soumettre une réponse</h3>

      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-primary/60 mb-2">
          Message <span className="text-red-500 normal-case">*</span>
        </label>
        <textarea
          className={`${inputClass} min-h-[120px] resize-y`}
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Décrivez votre approche, vos références, pourquoi vous êtes le bon prestataire... (min 50 caractères)"
          required
          minLength={50}
        />
        <p className="text-[10px] text-slate-400 mt-1">{message.length} / 50 min</p>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-primary/60 mb-2">Fourchette de prix</label>
        <input
          className={inputClass}
          value={priceRange}
          onChange={e => setPriceRange(e.target.value)}
          placeholder="ex: 50 000€ - 80 000€"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-primary/60 mb-2">Délai de réalisation</label>
        <input
          className={inputClass}
          value={deliveryTimeline}
          onChange={e => setDeliveryTimeline(e.target.value)}
          placeholder="ex: 3 mois"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={isPending || message.trim().length < 50}
        className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: "#16523A" }}
      >
        <span className="material-symbols-outlined text-base">send</span>
        {isPending ? "Envoi en cours..." : "Soumettre ma réponse"}
      </button>
    </form>
  );
}
