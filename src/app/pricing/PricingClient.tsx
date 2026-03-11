"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Props {
  currentPlan: string | null;
  isLoggedIn: boolean;
}

export default function PricingClient({ currentPlan, isLoggedIn }: Props) {
  const router = useRouter();
  const [modal, setModal] = useState<"pro" | "enterprise" | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [entName, setEntName] = useState("");
  const [entEmail, setEntEmail] = useState("");
  const [entMessage, setEntMessage] = useState("");
  const [entSuccess, setEntSuccess] = useState(false);
  const [entPending, startEntTransition] = useTransition();

  function openPro() {
    if (!isLoggedIn) { router.push("/login?redirect=/pricing"); return; }
    setModal("pro");
    setError(null);
  }

  function openEnterprise() {
    setModal("enterprise");
    setEntSuccess(false);
    setError(null);
    setEntName(""); setEntEmail(""); setEntMessage("");
  }

  function confirmPro() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: "pro" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur");
        router.push(data.url);
      } catch (e) { setError((e as Error).message); }
    });
  }

  function sendEnterprise(e: React.FormEvent) {
    e.preventDefault();
    startEntTransition(async () => {
      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: entName, email: entEmail, message: entMessage }),
        });
        if (!res.ok) throw new Error("Erreur lors de l'envoi");
        setEntSuccess(true);
      } catch (e) { setError((e as Error).message); }
    });
  }

  const isCurrentPro = currentPlan === "pro" || currentPlan === "enterprise";

  return (
    <>
      {/* ── 3 plan cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">

        {/* Starter */}
        <div className="card p-8 flex flex-col">
          <div className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4">Starter</div>
          <div className="text-4xl font-bold text-white mb-1">€0</div>
          <p className="text-slate-500 text-sm mb-6">Pour découvrir EnergyHub</p>
          <ul className="space-y-3 text-sm text-slate-400 mb-8 flex-1">
            <li className="flex gap-2"><span className="text-green-400">✓</span> 1 RFQ par mois</li>
            <li className="flex gap-2"><span className="text-green-400">✓</span> Accès annuaire</li>
            <li className="flex gap-2"><span className="text-slate-600">✗</span> Réponses aux RFQ</li>
            <li className="flex gap-2"><span className="text-slate-600">✗</span> Matching IA</li>
          </ul>
          {!isLoggedIn ? (
            <a href="/register" className="btn-secondary text-center block">Commencer gratuitement</a>
          ) : (
            <button disabled className="btn-secondary opacity-50 cursor-default">
              {currentPlan === "free" ? "Plan actuel" : "Plan de base"}
            </button>
          )}
        </div>

        {/* Pro */}
        <div className="card p-8 flex flex-col border-yellow-500/50 relative" style={{ transform: "scale(1.03)" }}>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-yellow-500 text-black">POPULAIRE</span>
          </div>
          <div className="text-xs font-bold tracking-widest text-yellow-500 uppercase mb-4">Pro</div>
          <div className="text-4xl font-bold text-white mb-1">€149<span className="text-base font-normal text-slate-400">/mois</span></div>
          <p className="text-slate-500 text-sm mb-6">Pour les acteurs actifs</p>
          <ul className="space-y-3 text-sm text-slate-400 mb-8 flex-1">
            <li className="flex gap-2"><span className="text-green-400">✓</span> RFQ illimités</li>
            <li className="flex gap-2"><span className="text-green-400">✓</span> Réponses aux RFQ</li>
            <li className="flex gap-2"><span className="text-green-400">✓</span> Matching IA (score 0-100)</li>
            <li className="flex gap-2"><span className="text-green-400">✓</span> Analytics</li>
            <li className="flex gap-2"><span className="text-green-400">✓</span> Module investissement</li>
          </ul>
          {isCurrentPro ? (
            <button disabled className="btn-primary opacity-50 cursor-default">Plan actuel</button>
          ) : (
            <button onClick={openPro} className="btn-primary">
              {isLoggedIn ? "Passer au Pro" : "Commencer avec Pro"}
            </button>
          )}
        </div>

        {/* Enterprise */}
        <div className="card p-8 flex flex-col border-purple-500/20">
          <div className="text-xs font-bold tracking-widest text-purple-400 uppercase mb-4">Enterprise</div>
          <div className="text-4xl font-bold text-white mb-1">Sur devis</div>
          <p className="text-slate-500 text-sm mb-6">Pour les grandes organisations</p>
          <ul className="space-y-3 text-sm text-slate-400 mb-8 flex-1">
            <li className="flex gap-2"><span className="text-green-400">✓</span> Tout le plan Pro</li>
            <li className="flex gap-2"><span className="text-green-400">✓</span> Multi-sièges</li>
            <li className="flex gap-2"><span className="text-green-400">✓</span> Accès API</li>
            <li className="flex gap-2"><span className="text-green-400">✓</span> Support dédié</li>
          </ul>
          <button onClick={openEnterprise} className="btn-secondary">Nous contacter</button>
        </div>
      </div>

      {/* ── Modal Pro ── */}
      {modal === "pro" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !isPending && setModal(null)}>
          <div className="card p-8 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-2">Passer au plan Pro</h2>
            <p className="text-slate-400 text-sm mb-4">Accédez à tous les outils de la marketplace.</p>
            <ul className="text-sm text-slate-300 space-y-2 mb-6">
              <li>✓ RFQ illimités</li>
              <li>✓ Matching IA</li>
              <li>✓ Analytics</li>
              <li>✓ Module investissement</li>
            </ul>
            <div className="text-2xl font-bold text-white mb-1">
              €149<span className="text-sm font-normal text-slate-400">/mois</span>
            </div>
            <p className="text-xs text-slate-500 mb-6">Résiliable à tout moment — sans engagement</p>
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} disabled={isPending} className="btn-secondary flex-1">Annuler</button>
              <button onClick={confirmPro} disabled={isPending} className="btn-primary flex-1 disabled:opacity-50">
                {isPending ? "Redirection..." : "Confirmer et payer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Enterprise ── */}
      {modal === "enterprise" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !entPending && setModal(null)}>
          <div className="card p-8 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-2">Demande Enterprise</h2>
            <p className="text-slate-400 text-sm mb-6">Notre équipe vous contacte sous 24h.</p>
            {entSuccess ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">✓</div>
                <p className="text-green-400 font-medium">Message envoyé !</p>
                <p className="text-slate-500 text-sm mt-1">Nous vous recontactons rapidement.</p>
                <button onClick={() => setModal(null)} className="btn-secondary mt-6">Fermer</button>
              </div>
            ) : (
              <form onSubmit={sendEnterprise} className="space-y-4">
                <div>
                  <label className="label">Nom *</label>
                  <input className="input w-full" value={entName} onChange={e => setEntName(e.target.value)} required disabled={entPending} />
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input type="email" className="input w-full" value={entEmail} onChange={e => setEntEmail(e.target.value)} required disabled={entPending} />
                </div>
                <div>
                  <label className="label">Message (optionnel)</label>
                  <textarea className="input w-full resize-none" rows={3} value={entMessage} onChange={e => setEntMessage(e.target.value)} disabled={entPending} placeholder="Décrivez votre besoin..." />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setModal(null)} disabled={entPending} className="btn-secondary flex-1">Annuler</button>
                  <button type="submit" disabled={entPending || !entName.trim() || !entEmail.trim()} className="btn-primary flex-1 disabled:opacity-50">
                    {entPending ? "Envoi..." : "Envoyer"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
