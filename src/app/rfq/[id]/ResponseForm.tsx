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

export default function ResponseForm({ rfqId, isLoggedIn, isOpen, isLimitReached, existingResponse }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [deliveryTimeline, setDeliveryTimeline] = useState("");

  if (!isLoggedIn) {
    return (
      <div className="card p-6 text-center">
        <p className="text-slate-400 mb-4">Connectez-vous pour répondre à cet appel d'offres</p>
        <div className="flex gap-3 justify-center">
          <Link href="/login" className="btn-primary">Se connecter</Link>
          <Link href="/register" className="btn-secondary">S'inscrire</Link>
        </div>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className="card p-6 text-center text-slate-500">
        <p>Cet appel d'offres n'accepte plus de réponses.</p>
      </div>
    );
  }

  if (existingResponse || success) {
    const resp = existingResponse;
    return (
      <div className="card p-6 border-green-400/20">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-green-400 text-lg">✓</span>
          <span className="font-semibold text-white text-sm">
            {success ? "Réponse soumise avec succès !" : "Vous avez déjà répondu"}
          </span>
        </div>
        {resp && (
          <div className="space-y-3 text-sm text-slate-400">
            <p className="leading-relaxed">{resp.message}</p>
            {resp.price_range && <p>💰 {resp.price_range}</p>}
            {resp.delivery_timeline && <p>🗓 {resp.delivery_timeline}</p>}
            <p className="text-[10px] text-slate-600">
              Soumis le {new Date(resp.submitted_at).toLocaleDateString("fr-BE")}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (isLimitReached) {
    return (
      <div className="card p-6 border-yellow-500/20">
        <p className="text-yellow-500 font-semibold text-sm mb-2">Limite mensuelle atteinte</p>
        <p className="text-slate-500 text-sm mb-4">
          Le plan Starter permet 1 réponse par mois. Passez au Pro pour répondre sans limite.
        </p>
        <Link href="/pricing" className="btn-primary text-sm">Voir les offres Pro →</Link>
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
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      <h3 className="font-semibold text-white">Soumettre une réponse</h3>

      <div>
        <label className="label">Message <span className="text-red-400">*</span></label>
        <textarea
          className="input min-h-[120px] resize-y"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Décrivez votre approche, vos références, pourquoi vous êtes le bon prestataire... (min 50 caractères)"
          required
          minLength={50}
        />
        <p className="text-[10px] text-slate-600 mt-1">{message.length} / 50 min</p>
      </div>

      <div>
        <label className="label">Fourchette de prix</label>
        <input
          className="input"
          value={priceRange}
          onChange={e => setPriceRange(e.target.value)}
          placeholder="ex: 50 000€ - 80 000€"
        />
      </div>

      <div>
        <label className="label">Délai de réalisation</label>
        <input
          className="input"
          value={deliveryTimeline}
          onChange={e => setDeliveryTimeline(e.target.value)}
          placeholder="ex: 3 mois"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isPending || message.trim().length < 50}
        className="btn-primary w-full disabled:opacity-50"
      >
        {isPending ? "Envoi en cours..." : "Soumettre ma réponse →"}
      </button>
    </form>
  );
}
