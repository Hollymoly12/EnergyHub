"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Props {
  currentPlan: string | null;
  isLoggedIn: boolean;
}

const inputClass = "w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all";

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

  const checkItem = (text: string, included = true) => (
    <li className="flex items-center gap-3 text-sm">
      <div className={`size-5 rounded-full flex items-center justify-center shrink-0 ${included ? "bg-accent" : "bg-slate-100"}`}>
        <span className={`material-symbols-outlined text-xs ${included ? "text-primary" : "text-slate-300"}`}>
          {included ? "check" : "close"}
        </span>
      </div>
      <span className={included ? "text-slate-700" : "text-slate-400"}>{text}</span>
    </li>
  );

  return (
    <>
      {/* ── 3 plan cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">

        {/* Starter */}
        <div className="bg-white rounded-3xl p-8 flex flex-col border border-black/5">
          <div className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4">Starter</div>
          <div className="text-4xl font-extrabold text-primary mb-1 font-display">€0</div>
          <p className="text-slate-400 text-sm mb-8">Pour découvrir EnergyHub</p>
          <ul className="space-y-3 mb-8 flex-1">
            {checkItem("1 RFQ par mois")}
            {checkItem("Accès annuaire")}
            {checkItem("Réponses aux RFQ", false)}
            {checkItem("Matching IA", false)}
          </ul>
          {!isLoggedIn ? (
            <a
              href="/register"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm border transition-colors hover:bg-slate-50 text-center"
              style={{ borderColor: "#16523A", color: "#16523A" }}
            >
              Commencer gratuitement
            </a>
          ) : (
            <button
              disabled
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-slate-100 text-slate-400 cursor-default"
            >
              {currentPlan === "free" ? "Plan actuel" : "Plan de base"}
            </button>
          )}
        </div>

        {/* Pro */}
        <div className="bg-primary rounded-3xl p-8 flex flex-col relative" style={{ transform: "scale(1.03)" }}>
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-accent text-primary">POPULAIRE</span>
          </div>
          <div className="text-xs font-bold tracking-widest text-accent/80 uppercase mb-4">Pro</div>
          <div className="text-4xl font-extrabold text-white mb-1 font-display">
            €149<span className="text-base font-normal text-white/50">/mois</span>
          </div>
          <p className="text-white/50 text-sm mb-8">Pour les acteurs actifs</p>
          <ul className="space-y-3 mb-8 flex-1">
            {["RFQ illimités", "Réponses aux RFQ", "Matching IA (score 0-100)", "Analytics", "Module investissement"].map(text => (
              <li key={text} className="flex items-center gap-3 text-sm">
                <div className="size-5 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xs text-primary">check</span>
                </div>
                <span className="text-white/80">{text}</span>
              </li>
            ))}
          </ul>
          {isCurrentPro ? (
            <button
              disabled
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-white/20 text-white cursor-default"
            >
              Plan actuel
            </button>
          ) : (
            <button
              onClick={openPro}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-accent text-primary transition-opacity hover:opacity-90"
            >
              {isLoggedIn ? "Passer au Pro" : "Commencer avec Pro"}
            </button>
          )}
        </div>

        {/* Enterprise */}
        <div className="bg-white rounded-3xl p-8 flex flex-col border border-black/5">
          <div className="text-xs font-bold tracking-widest text-primary/50 uppercase mb-4">Enterprise</div>
          <div className="text-4xl font-extrabold text-primary mb-1 font-display">Sur devis</div>
          <p className="text-slate-400 text-sm mb-8">Pour les grandes organisations</p>
          <ul className="space-y-3 mb-8 flex-1">
            {checkItem("Tout le plan Pro")}
            {checkItem("Multi-sièges")}
            {checkItem("Accès API")}
            {checkItem("Support dédié")}
          </ul>
          <button
            onClick={openEnterprise}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm border transition-colors hover:bg-slate-50"
            style={{ borderColor: "#16523A", color: "#16523A" }}
          >
            Nous contacter
          </button>
        </div>
      </div>

      {/* ── Modal Pro ── */}
      {modal === "pro" && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !isPending && setModal(null)}
        >
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-black/5" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-primary mb-1 font-display">Passer au plan Pro</h2>
            <p className="text-slate-400 text-sm mb-5">Accédez à tous les outils de la marketplace.</p>
            <ul className="space-y-2.5 mb-6">
              {["RFQ illimités", "Matching IA", "Analytics", "Module investissement"].map(text => (
                <li key={text} className="flex items-center gap-3 text-sm text-slate-700">
                  <div className="size-5 rounded-full bg-accent flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xs text-primary">check</span>
                  </div>
                  {text}
                </li>
              ))}
            </ul>
            <div className="text-3xl font-bold text-primary mb-1 font-display">
              €149<span className="text-sm font-normal text-slate-400">/mois</span>
            </div>
            <p className="text-xs text-slate-400 mb-6">Résiliable à tout moment — sans engagement</p>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setModal(null)}
                disabled={isPending}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-sm border transition-colors hover:bg-slate-50"
                style={{ borderColor: "#16523A", color: "#16523A" }}
              >
                Annuler
              </button>
              <button
                onClick={confirmPro}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#16523A" }}
              >
                <span className="material-symbols-outlined text-base">credit_card</span>
                {isPending ? "Redirection..." : "Confirmer et payer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Enterprise ── */}
      {modal === "enterprise" && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !entPending && setModal(null)}
        >
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-black/5" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-primary mb-1 font-display">Demande Enterprise</h2>
            <p className="text-slate-400 text-sm mb-6">Notre équipe vous contacte sous 24h.</p>
            {entSuccess ? (
              <div className="text-center py-6">
                <div className="size-16 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-2xl text-primary">check</span>
                </div>
                <p className="text-primary font-bold font-display text-lg">Message envoyé !</p>
                <p className="text-slate-400 text-sm mt-1 mb-6">Nous vous recontactons rapidement.</p>
                <button
                  onClick={() => setModal(null)}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm border transition-colors hover:bg-slate-50"
                  style={{ borderColor: "#16523A", color: "#16523A" }}
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={sendEnterprise} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-primary/60 mb-2">Nom *</label>
                  <input className={inputClass} value={entName} onChange={e => setEntName(e.target.value)} required disabled={entPending} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-primary/60 mb-2">Email *</label>
                  <input type="email" className={inputClass} value={entEmail} onChange={e => setEntEmail(e.target.value)} required disabled={entPending} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-primary/60 mb-2">Message (optionnel)</label>
                  <textarea className={`${inputClass} resize-none`} rows={3} value={entMessage} onChange={e => setEntMessage(e.target.value)} disabled={entPending} placeholder="Décrivez votre besoin..." />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    disabled={entPending}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-sm border transition-colors hover:bg-slate-50"
                    style={{ borderColor: "#16523A", color: "#16523A" }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={entPending || !entName.trim() || !entEmail.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: "#16523A" }}
                  >
                    <span className="material-symbols-outlined text-base">send</span>
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
