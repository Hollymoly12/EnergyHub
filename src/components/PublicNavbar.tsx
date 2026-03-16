// src/components/PublicNavbar.tsx
import Link from "next/link";

const NAV_LINKS = [
  { label: "Annuaire", href: "/directory" },
  { label: "Projets", href: "/projets" },
  { label: "Investissements", href: "/investment" },
];

interface PublicNavbarProps {
  activePath?: string;
  isLoggedIn?: boolean;
}

export default function PublicNavbar({ activePath, isLoggedIn }: PublicNavbarProps) {
  return (
    <nav className="sticky top-0 z-50 h-16 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <span
              className="material-symbols-outlined text-accent"
              style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}
            >
              bolt
            </span>
          </div>
          <span className="font-display font-extrabold text-xl text-primary tracking-tight">
            EnergyHub
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ label, href }) => {
            const isActive = activePath === href;
            return (
              <Link
                key={label}
                href={href}
                className={`text-sm font-semibold px-4 py-2 rounded-full transition-colors no-underline ${
                  isActive
                    ? "text-primary bg-primary/5"
                    : "text-slate-600 hover:text-primary hover:bg-primary/5"
                }`}
              >
                {isActive ? (
                  <span className="border-b-2 border-primary pb-px">{label}</span>
                ) : (
                  label
                )}
              </Link>
            );
          })}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="bg-primary text-white text-sm font-semibold px-5 py-2 rounded-full hover:opacity-90 transition-opacity no-underline"
            >
              Mon compte
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors no-underline px-3 py-2"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="bg-primary text-white text-sm font-semibold px-5 py-2 rounded-full hover:opacity-90 transition-opacity no-underline"
              >
                Rejoindre
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
