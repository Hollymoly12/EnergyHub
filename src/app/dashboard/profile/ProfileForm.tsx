"use client";

import { useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileData {
  name: string;
  short_description: string;
  description: string;
  logo_url: string;
  cover_image_url: string;
  region: string;
  city: string;
  address: string;
  website: string;
  phone: string;
  linkedin_url: string;
  technologies: string[];
  tags: string[];
  certifications: string[];
  founded_year: string;
  team_size: string;
  annual_revenue: string;
}

interface Props {
  org: Record<string, unknown>;
  memberId: string;
  agentSuggestion: Record<string, unknown> | null;
}

type SectionKey = "presentation" | "visual" | "location" | "contact" | "expertise" | "company";

// ─── Score calculation (mirrors the SQL function) ─────────────────────────────

function calcScore(d: ProfileData): number {
  let s = 0;
  if (d.name) s += 15;
  if (d.description && d.description.length > 100) s += 20;
  if (d.logo_url) s += 15;
  if (d.website) s += 10;
  if (d.city) s += 10;
  if (d.certifications.length > 0) s += 10;
  if (d.tags.length > 0) s += 10;
  if (d.phone) s += 5;
  if (d.linkedin_url) s += 5;
  return s;
}

// ─── Score breakdown per section ─────────────────────────────────────────────

const SECTION_POINTS: Record<SectionKey, number> = {
  presentation: 35, // name(15) + description(20)
  visual: 15,       // logo_url(15)
  location: 10,     // city(10)
  contact: 20,      // website(10) + phone(5) + linkedin(5)
  expertise: 20,    // tags(10) + certifications(10)
  company: 0,
};

const SECTIONS: { key: SectionKey; label: string; icon: string }[] = [
  { key: "presentation", icon: "◎", label: "Présentation" },
  { key: "visual",       icon: "◈", label: "Identité visuelle" },
  { key: "location",     icon: "◉", label: "Localisation" },
  { key: "contact",      icon: "◌", label: "Contact & réseaux" },
  { key: "expertise",    icon: "◆", label: "Expertise & tags" },
  { key: "company",      icon: "◇", label: "Entreprise" },
];

const REGIONS = ["Wallonie", "Flandre", "Bruxelles-Capitale"];
const TEAM_SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"];
const REVENUES = [
  "< 500K €", "500K – 2M €", "2M – 10M €",
  "10M – 50M €", "50M – 200M €", "> 200M €",
];

// ─── Tag chip input ────────────────────────────────────────────────────────────

function TagInput({
  label, values, onChange, placeholder, accent = false,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  accent?: boolean;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput("");
  };

  const remove = (i: number) => onChange(values.filter((_, idx) => idx !== i));

  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
        {values.map((v, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
              accent
                ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                : "bg-slate-800 text-slate-300 border border-slate-700"
            }`}
          >
            {v}
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-slate-500 hover:text-slate-300 leading-none"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="input flex-1"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder || "Tapez et appuyez sur Entrée"}
        />
        <button
          type="button"
          onClick={add}
          className="btn-secondary px-4 py-2 text-xs"
        >
          + Ajouter
        </button>
      </div>
    </div>
  );
}

// ─── SVG Completion Ring ──────────────────────────────────────────────────────

function CompletionRing({ score }: { score: number }) {
  const r = 15.9;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;

  const color =
    score >= 80 ? "#4ADE80" :
    score >= 50 ? "#F59E0B" :
    "#EF4444";

  return (
    <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
      <circle cx="18" cy="18" r={r} fill="none" stroke="#1E293B" strokeWidth="2.5" />
      <circle
        cx="18" cy="18" r={r}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circ - filled}`}
        style={{ transition: "stroke-dasharray 0.4s ease, stroke 0.4s ease" }}
      />
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProfileForm({ org, agentSuggestion }: Props) {
  const [section, setSection] = useState<SectionKey>("presentation");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [suggestion, setSuggestion] = useState(agentSuggestion);

  const [data, setData] = useState<ProfileData>({
    name:              (org.name as string) || "",
    short_description: (org.short_description as string) || "",
    description:       (org.description as string) || "",
    logo_url:          (org.logo_url as string) || "",
    cover_image_url:   (org.cover_image_url as string) || "",
    region:            (org.region as string) || "",
    city:              (org.city as string) || "",
    address:           (org.address as string) || "",
    website:           (org.website as string) || "",
    phone:             (org.phone as string) || "",
    linkedin_url:      (org.linkedin_url as string) || "",
    technologies:      (org.technologies as string[]) || [],
    tags:              (org.tags as string[]) || [],
    certifications:    (org.certifications as string[]) || [],
    founded_year:      org.founded_year ? String(org.founded_year) : "",
    team_size:         (org.team_size as string) || "",
    annual_revenue:    (org.annual_revenue as string) || "",
  });

  const score = calcScore(data);

  const set = useCallback(
    (field: keyof ProfileData) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setData(prev => ({ ...prev, [field]: e.target.value }));
        setSaved(false);
      },
    []
  );

  const setArr = useCallback(
    (field: keyof ProfileData) => (v: string[]) => {
      setData(prev => ({ ...prev, [field]: v }));
      setSaved(false);
    },
    []
  );

  const save = async () => {
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          founded_year: data.founded_year ? parseInt(data.founded_year) : null,
        }),
      });

      if (!res.ok) {
        const j = await res.json();
        setError(j.error || "Erreur lors de la sauvegarde");
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);

      // Rafraîchir les suggestions agent si profil < 80%
      if (score < 80) {
        fetch("/api/agents/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId: org.id,
            actorType: org.actor_type,
            profileData: data,
            currentStep: 1,
          }),
        })
          .then(r => r.json())
          .then(j => { if (j.output) setSuggestion(j.output); })
          .catch(() => {});
      }
    } finally {
      setSaving(false);
    }
  };

  // Section completeness indicators
  const sectionDone = (key: SectionKey): boolean => {
    if (key === "presentation") return !!data.name && data.description.length > 100;
    if (key === "visual") return !!data.logo_url;
    if (key === "location") return !!data.city;
    if (key === "contact") return !!data.website;
    if (key === "expertise") return data.tags.length > 0;
    if (key === "company") return !!data.team_size;
    return false;
  };

  return (
    <div className="flex gap-6 items-start">

      {/* ── Left sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 sticky top-8 space-y-4">

        {/* Score card */}
        <div className="card p-5 flex flex-col items-center text-center">
          <div className="relative mb-3">
            <CompletionRing score={score} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">{score}%</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wide">complet</span>
            </div>
          </div>
          <div className="text-xs font-semibold text-white mb-0.5">
            {score >= 80 ? "Excellent profil !" : score >= 50 ? "Bon début" : "À compléter"}
          </div>
          <div className="text-[11px] text-slate-500">
            {score < 80
              ? `+${100 - score}% pour atteindre le niveau optimal`
              : "Votre profil est optimisé"}
          </div>

          {/* Points remaining per section */}
          {score < 100 && (
            <div className="mt-4 w-full space-y-1.5 text-left">
              {Object.entries(SECTION_POINTS)
                .filter(([, pts]) => pts > 0)
                .map(([key, pts]) => {
                  const done = sectionDone(key as SectionKey);
                  return (
                    <div key={key} className="flex items-center justify-between text-[11px]">
                      <span className={done ? "text-slate-600 line-through" : "text-slate-400"}>
                        {SECTIONS.find(s => s.key === key)?.label}
                      </span>
                      <span className={done ? "text-slate-600" : "text-yellow-500 font-semibold"}>
                        {done ? "✓" : `+${pts}pts`}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Section nav */}
        <nav className="card overflow-hidden">
          {SECTIONS.map((s, i) => {
            const done = sectionDone(s.key);
            const active = section === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setSection(s.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-all
                  ${i > 0 ? "border-t border-slate-800" : ""}
                  ${active
                    ? "bg-yellow-500/8 text-white border-l-2 border-yellow-500"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
              >
                <span className={`text-base leading-none ${active ? "text-yellow-500" : "text-slate-600"}`}>
                  {done ? "✓" : s.icon}
                </span>
                <span className="flex-1">{s.label}</span>
                {SECTION_POINTS[s.key] > 0 && !done && (
                  <span className="text-[10px] text-slate-600 font-medium">
                    +{SECTION_POINTS[s.key]}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Agent suggestions */}
        {suggestion && (suggestion.next_actions as unknown[])?.length > 0 && (
          <div className="card p-4 border-yellow-500/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🤖</span>
              <span className="text-xs font-semibold text-yellow-400">Suggestions IA</span>
            </div>
            <div className="space-y-2">
              {(suggestion.next_actions as Array<{ action: string; reason: string }>)
                .slice(0, 3)
                .map((a, i) => (
                  <div key={i} className="text-[11px] text-slate-400 flex gap-2">
                    <span className="text-yellow-600 shrink-0">→</span>
                    <span>{a.action}</span>
                  </div>
                ))}
            </div>
            {suggestion.completion_tips && (
              <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-500 italic">
                {suggestion.completion_tips as string}
              </div>
            )}
          </div>
        )}
      </aside>

      {/* ── Form content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <div className="card overflow-hidden">

          {/* Section header */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-semibold text-white text-sm">
                {SECTIONS.find(s => s.key === section)?.label}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {section === "presentation" && "Nom, accroche et description détaillée"}
                {section === "visual" && "Logo et image de couverture de votre organisation"}
                {section === "location" && "Votre région et localisation en Belgique"}
                {section === "contact" && "Site web, téléphone et profil LinkedIn"}
                {section === "expertise" && "Technologies maîtrisées, certifications et mots-clés"}
                {section === "company" && "Informations générales sur votre entreprise"}
              </div>
            </div>
            {SECTION_POINTS[section] > 0 && (
              <span className="text-xs text-yellow-500 font-semibold bg-yellow-500/10 px-3 py-1 rounded-full">
                jusqu'à +{SECTION_POINTS[section]} pts
              </span>
            )}
          </div>

          <div className="p-6 space-y-5">

            {/* ── PRÉSENTATION ── */}
            {section === "presentation" && (
              <>
                <div>
                  <label className="label">
                    Nom de l'organisation
                    <span className="ml-1 text-yellow-500">+15 pts</span>
                  </label>
                  <input
                    className="input"
                    value={data.name}
                    onChange={set("name")}
                    placeholder="Votre entreprise"
                  />
                </div>

                <div>
                  <label className="label">Accroche courte (max 160 caractères)</label>
                  <input
                    className="input"
                    value={data.short_description}
                    onChange={set("short_description")}
                    maxLength={160}
                    placeholder="Ce que vous faites en une phrase"
                  />
                  <div className="text-[11px] text-slate-600 mt-1 text-right">
                    {data.short_description.length}/160
                  </div>
                </div>

                <div>
                  <label className="label">
                    Description détaillée
                    <span className="ml-1 text-yellow-500">+20 pts si &gt; 100 caractères</span>
                  </label>
                  <textarea
                    className="input resize-none"
                    rows={6}
                    value={data.description}
                    onChange={set("description")}
                    placeholder="Décrivez vos activités, expertise, projets réalisés, différenciateurs..."
                  />
                  <div className={`text-[11px] mt-1 flex items-center justify-between ${
                    data.description.length > 100 ? "text-green-400" : "text-slate-500"
                  }`}>
                    <span>
                      {data.description.length > 100
                        ? "✓ Description suffisante pour les +20 pts"
                        : `Encore ${100 - data.description.length} caractères pour débloquer les points`}
                    </span>
                    <span>{data.description.length} car.</span>
                  </div>
                </div>
              </>
            )}

            {/* ── VISUEL ── */}
            {section === "visual" && (
              <>
                <div>
                  <label className="label">
                    URL du logo
                    <span className="ml-1 text-yellow-500">+15 pts</span>
                  </label>
                  <input
                    className="input"
                    value={data.logo_url}
                    onChange={set("logo_url")}
                    placeholder="https://example.com/logo.png"
                  />
                  {data.logo_url && (
                    <div className="mt-3 flex items-center gap-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
                      <div className="w-16 h-16 rounded-lg bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                        <img
                          src={data.logo_url}
                          alt="Logo preview"
                          className="w-full h-full object-contain"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-white">Aperçu du logo</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Format recommandé : carré, PNG ou SVG, fond transparent
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="label">URL de l'image de couverture</label>
                  <input
                    className="input"
                    value={data.cover_image_url}
                    onChange={set("cover_image_url")}
                    placeholder="https://example.com/cover.jpg"
                  />
                  {data.cover_image_url && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-slate-700 h-32">
                      <img
                        src={data.cover_image_url}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── LOCALISATION ── */}
            {section === "location" && (
              <>
                <div>
                  <label className="label">Région</label>
                  <select className="input" value={data.region} onChange={set("region")}>
                    <option value="">Sélectionner une région</option>
                    {REGIONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">
                    Ville
                    <span className="ml-1 text-yellow-500">+10 pts</span>
                  </label>
                  <input
                    className="input"
                    value={data.city}
                    onChange={set("city")}
                    placeholder="Bruxelles, Liège, Gand..."
                  />
                </div>

                <div>
                  <label className="label">Adresse complète</label>
                  <input
                    className="input"
                    value={data.address}
                    onChange={set("address")}
                    placeholder="Rue de la Loi 16, 1000 Bruxelles"
                  />
                </div>
              </>
            )}

            {/* ── CONTACT ── */}
            {section === "contact" && (
              <>
                <div>
                  <label className="label">
                    Site web
                    <span className="ml-1 text-yellow-500">+10 pts</span>
                  </label>
                  <input
                    className="input"
                    value={data.website}
                    onChange={set("website")}
                    placeholder="https://www.votre-entreprise.be"
                  />
                </div>

                <div>
                  <label className="label">
                    Téléphone
                    <span className="ml-1 text-yellow-500">+5 pts</span>
                  </label>
                  <input
                    className="input"
                    value={data.phone}
                    onChange={set("phone")}
                    placeholder="+32 2 000 00 00"
                  />
                </div>

                <div>
                  <label className="label">
                    LinkedIn
                    <span className="ml-1 text-yellow-500">+5 pts</span>
                  </label>
                  <input
                    className="input"
                    value={data.linkedin_url}
                    onChange={set("linkedin_url")}
                    placeholder="https://www.linkedin.com/company/votre-entreprise"
                  />
                </div>
              </>
            )}

            {/* ── EXPERTISE ── */}
            {section === "expertise" && (
              <>
                <TagInput
                  label="Tags / mots-clés"
                  values={data.tags}
                  onChange={setArr("tags")}
                  placeholder="photovoltaïque, smart grid, B2B..."
                  accent
                />
                <div className="text-[11px] text-yellow-600 -mt-2">
                  +10 pts au premier tag ajouté
                </div>

                <TagInput
                  label="Technologies maîtrisées"
                  values={data.technologies}
                  onChange={setArr("technologies")}
                  placeholder="SCADA, EMS, IoT, BMS..."
                />

                <TagInput
                  label="Certifications"
                  values={data.certifications}
                  onChange={setArr("certifications")}
                  placeholder="ISO 9001, QUALIFELEC, CERTIBEAU..."
                />
                <div className="text-[11px] text-yellow-600 -mt-2">
                  +10 pts à la première certification ajoutée
                </div>
              </>
            )}

            {/* ── ENTREPRISE ── */}
            {section === "company" && (
              <>
                <div>
                  <label className="label">Année de fondation</label>
                  <input
                    type="number"
                    className="input"
                    value={data.founded_year}
                    onChange={set("founded_year")}
                    placeholder="2015"
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>

                <div>
                  <label className="label">Taille de l'équipe</label>
                  <select className="input" value={data.team_size} onChange={set("team_size")}>
                    <option value="">Sélectionner</option>
                    {TEAM_SIZES.map(s => (
                      <option key={s} value={s}>{s} employés</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Chiffre d'affaires annuel</label>
                  <select className="input" value={data.annual_revenue} onChange={set("annual_revenue")}>
                    <option value="">Sélectionner (optionnel)</option>
                    {REVENUES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

          </div>

          {/* ── Footer save bar ── */}
          <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {saved && (
                <span className="text-xs text-green-400 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Enregistré
                </span>
              )}
              {error && (
                <span className="text-xs text-red-400">{error}</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Navigation entre sections */}
              {SECTIONS.findIndex(s => s.key === section) > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const idx = SECTIONS.findIndex(s => s.key === section);
                    setSection(SECTIONS[idx - 1].key);
                  }}
                  className="btn-secondary py-2 px-4 text-xs"
                >
                  ← Précédent
                </button>
              )}

              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="btn-primary py-2 px-5 text-xs disabled:opacity-50"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Sauvegarde...
                  </span>
                ) : "Enregistrer"}
              </button>

              {SECTIONS.findIndex(s => s.key === section) < SECTIONS.length - 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const idx = SECTIONS.findIndex(s => s.key === section);
                    setSection(SECTIONS[idx + 1].key);
                  }}
                  className="btn-secondary py-2 px-4 text-xs"
                >
                  Suivant →
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Bottom score summary */}
        <div className="mt-4 card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-32 bg-slate-800 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${score}%`,
                  background: score >= 80 ? "#4ADE80" : score >= 50 ? "#F59E0B" : "#EF4444",
                }}
              />
            </div>
            <span className="text-xs text-slate-400">{score}% de complétion</span>
          </div>
          <span className="text-[11px] text-slate-600">
            Toutes les modifications sont sauvegardées par section
          </span>
        </div>
      </div>
    </div>
  );
}
