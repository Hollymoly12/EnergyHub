// src/app/investment/submit/page.tsx
import DealForm from "./DealForm";

export const metadata = {
  title: "Soumettre un deal — EnergyHub",
};

export default function SubmitDealPage() {
  return (
    <div className="min-h-screen" style={{ background: "#080C14" }}>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <div className="text-xs font-bold tracking-widest text-yellow-500 uppercase mb-3">
            Investissement
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Soumettre un deal</h1>
          <p className="text-slate-400">
            Présentez votre projet aux investisseurs de la marketplace EnergyHub.
            Une analyse IA sera générée automatiquement après soumission.
          </p>
        </div>
        <DealForm />
      </div>
    </div>
  );
}
