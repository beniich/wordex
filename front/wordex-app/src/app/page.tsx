"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

// ── Animated counter ──────────────────────────────────────────────────────────

function AnimatedNumber({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let start = 0;
      const step = () => {
        start += to / 60;
        setVal(Math.min(Math.round(start), to));
        if (start < to) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{val}{suffix}</span>;
}

// ── Feature card ──────────────────────────────────────────────────────────────

function FeatureCard({ icon, title, desc, accent }: { icon: string; title: string; desc: string; accent?: boolean }) {
  return (
    <div className={`group rounded-3xl p-8 flex flex-col gap-4 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl cursor-default
      ${accent
        ? "bg-[#1c1c1a] text-white"
        : "bg-white/70 backdrop-blur-xl border border-[#d8c3b4]/20 text-[#1c1c1a]"
      }`}
    >
      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow transition-transform group-hover:scale-110
        ${accent ? "bg-[#894d0d]" : "bg-[#f0ede9]"}`}
      >
        <span className={`material-symbols-outlined text-2xl ${accent ? "text-white" : "text-[#894d0d]"}`}>{icon}</span>
      </div>
      <h3 className={`text-xl font-black tracking-tight ${accent ? "text-white" : "text-[#1c1c1a]"}`}>{title}</h3>
      <p className={`text-sm leading-relaxed font-medium ${accent ? "text-stone-400" : "text-[#524439]"}`}>{desc}</p>
    </div>
  );
}

// ── Testimonial card ──────────────────────────────────────────────────────────

function TestimonialCard({ quote, name, role, org }: { quote: string; name: string; role: string; org: string }) {
  return (
    <div className="bg-white/70 backdrop-blur-xl border border-[#d8c3b4]/20 rounded-3xl p-8 flex flex-col gap-6 hover:shadow-lg transition-shadow">
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => <span key={i} className="text-[#894d0d] text-lg">★</span>)}
      </div>
      <p className="text-[#524439] font-medium leading-relaxed italic">"{quote}"</p>
      <div className="flex items-center gap-3 pt-2 border-t border-[#d8c3b4]/20">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#894d0d] to-[#a76526] flex items-center justify-center text-white font-black text-sm">
          {name[0]}
        </div>
        <div>
          <div className="font-black text-sm text-[#1c1c1a]">{name}</div>
          <div className="text-[10px] text-[#857467] font-medium">{role} · {org}</div>
        </div>
      </div>
    </div>
  );
}

// ── Pricing plan card ─────────────────────────────────────────────────────────

function PricingCard({ plan, price, features, highlighted, badge, onSelect }: {
  plan: string; price: number; features: string[]; highlighted?: boolean; badge?: string; onSelect: () => void;
}) {
  return (
    <div className={`relative flex flex-col rounded-3xl p-8 transition-all duration-500
      ${highlighted
        ? "bg-[#1c1c1a] text-white shadow-2xl shadow-[#894d0d]/20 scale-[1.03] z-10"
        : "bg-white/70 backdrop-blur-xl border border-[#d8c3b4]/20"
      }`}
    >
      {badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#894d0d] to-[#a76526] text-white text-[10px] font-black uppercase tracking-widest px-5 py-1.5 rounded-full shadow-lg whitespace-nowrap">
          ✦ {badge}
        </div>
      )}
      <div className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 ${highlighted ? "text-[#a76526]" : "text-[#894d0d]"}`}>{plan}</div>
      <div className="flex items-end gap-1 mb-6">
        <span className={`text-5xl font-black ${highlighted ? "text-white" : "text-[#1c1c1a]"}`}>
          {price === 0 ? "Gratuit" : `${price}€`}
        </span>
        {price > 0 && <span className={`text-sm pb-2 font-medium ${highlighted ? "text-stone-400" : "text-[#857467]"}`}>/mois</span>}
      </div>
      <ul className="space-y-3 flex-1 mb-8">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm font-medium">
            <span className={`mt-0.5 ${highlighted ? "text-[#894d0d]" : "text-emerald-500"}`}>✓</span>
            <span className={highlighted ? "text-stone-300" : "text-[#524439]"}>{f}</span>
          </li>
        ))}
      </ul>
      <button
        id={`pricing-cta-${plan}`}
        onClick={onSelect}
        className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]
          ${highlighted
            ? "bg-gradient-to-r from-[#894d0d] to-[#a76526] text-white shadow-lg shadow-[#894d0d]/40"
            : price === 0
            ? "bg-[#f0ede9] text-[#524439] hover:bg-[#e5e2de]"
            : "bg-[#1c1c1a] text-white hover:bg-[#31302e]"
          }`}
      >
        {price === 0 ? "Commencer gratuitement" : `Choisir ${plan}`}
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!loading && user) router.push("/dashboard");
  }, [user, loading, router]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (loading) return null;

  const handlePlanSelect = (plan: string) => {
    if (plan === "FREE") router.push("/auth/register");
    else router.push(`/admin/billing?plan=${plan}`);
  };

  return (
    <div className="bg-[#fcf9f5] font-[Manrope,sans-serif] text-[#1c1c1a] min-h-screen overflow-x-hidden selection:bg-[#ffdcc2] selection:text-[#6d3a00]">

      {/* ── NAV ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-[#fcf9f5]/95 backdrop-blur-3xl shadow-sm" : ""}`}>
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-black tracking-tighter text-[#894d0d]">Wordex</Link>
          <div className="hidden md:flex gap-8 items-center text-xs font-black uppercase tracking-widest text-[#524439]">
            <a href="#features" className="hover:text-[#894d0d] transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="hover:text-[#894d0d] transition-colors">Tarifs</a>
            <a href="#testimonials" className="hover:text-[#894d0d] transition-colors">Avis</a>
            <Link href="/auth/login" className="hover:text-[#894d0d] transition-colors">Connexion</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="hidden md:block text-xs font-black uppercase tracking-widest px-4 py-2 border border-[#d8c3b4]/50 rounded-xl text-[#524439] hover:bg-[#f0ede9] transition-colors">
              Se connecter
            </Link>
            <Link href="/auth/register" id="nav-cta" className="text-xs font-black uppercase tracking-widest px-5 py-2.5 bg-[#894d0d] text-white rounded-xl hover:bg-[#a76526] transition-all shadow-lg shadow-[#894d0d]/25 hover:scale-105 active:scale-95">
              Essai gratuit
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <main className="pt-36 pb-24 px-8 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#894d0d]/6 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-[#006576]/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center relative z-10">
          <div className="space-y-8">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#ffdcc2] text-[#6d3a00] rounded-full text-[10px] font-black tracking-[0.2em] uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#894d0d] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#894d0d]" />
              </span>
              Conçu pour les cliniques & équipes médicales
            </div>

            <h1 className="text-6xl md:text-7xl font-black tracking-tighter leading-[0.9]">
              Le workspace
              <span className="block text-[#894d0d] italic" style={{ fontFamily: "'Georgia', serif" }}>tout-en-un</span>
              pour votre clinique.
            </h1>

            <p className="text-lg text-[#524439] font-medium leading-relaxed max-w-lg">
              Documents collaboratifs, tableaux de bord industriels, agents IA intégrés et gestion de projets — dans un seul outil sécurisé, conforme RGPD, pensé pour le secteur médical.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/auth/register" id="hero-cta-primary" className="bg-gradient-to-tr from-[#894d0d] to-[#a76526] shadow-xl shadow-[#894d0d]/30 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                Démarrer gratuitement
                <span className="material-symbols-outlined text-lg">north_east</span>
              </Link>
              <a href="#pricing" className="bg-white/80 border border-[#d8c3b4]/30 px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-[#894d0d] hover:bg-white transition-all">
                Voir les tarifs
              </a>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-6 pt-4 border-t border-[#d8c3b4]/30">
              <div className="flex -space-x-2">
                {["D", "M", "S", "A", "L"].map((l, i) => (
                  <div key={i} className="h-8 w-8 rounded-full bg-gradient-to-br from-[#894d0d] to-[#a76526] flex items-center justify-center text-white text-xs font-black border-2 border-[#fcf9f5]">{l}</div>
                ))}
              </div>
              <div>
                <div className="font-black text-sm">+152 professionnels de santé</div>
                <div className="text-[10px] text-[#857467] font-medium uppercase tracking-wider">nous font confiance</div>
              </div>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative flex justify-center">
            <div className="relative w-full max-w-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-[#894d0d]/20 to-[#006576]/10 rounded-[3rem] rotate-3 scale-105 blur-3xl" />
              <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/40 bg-white">
                {/* Mock dashboard preview */}
                <div className="bg-[#1c1c1a] px-5 py-3 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500 opacity-70" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500 opacity-70" />
                    <div className="h-3 w-3 rounded-full bg-emerald-500 opacity-70" />
                  </div>
                  <span className="text-stone-400 text-xs font-mono ml-3">Wordex — Clinique Alpha</span>
                </div>
                <div className="p-6 bg-[#fcf9f5] space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[{ l: "TRS Global", v: "88%", c: "text-emerald-600" }, { l: "Docs actifs", v: "142", c: "text-[#894d0d]" }, { l: "Utilisateurs", v: "12", c: "text-[#006576]" }].map((k) => (
                      <div key={k.l} className="bg-white rounded-2xl p-3 border border-[#d8c3b4]/20">
                        <div className="text-[9px] font-black uppercase tracking-widest text-[#857467] mb-1">{k.l}</div>
                        <div className={`text-xl font-black ${k.c}`}>{k.v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white rounded-2xl p-4 border border-[#d8c3b4]/20">
                    <div className="text-[9px] font-black uppercase tracking-widest text-[#857467] mb-3">Production Shift</div>
                    <div className="flex items-end gap-1.5 h-16">
                      {[60, 80, 45, 90, 72, 85, 95, 70, 88].map((h, i) => (
                        <div key={i} className="flex-1 bg-gradient-to-t from-[#894d0d] to-[#a76526] rounded-t opacity-80" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="bg-[#894d0d] rounded-2xl p-4 flex items-center gap-3">
                    <div className="h-8 w-8 bg-white/20 rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-sm">psychology</span>
                    </div>
                    <div>
                      <div className="text-white font-black text-xs">Agent IA actif</div>
                      <div className="text-white/60 text-[10px]">Analyse de la production en cours…</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating badges */}
              <div className="absolute -right-6 top-16 bg-white border border-[#d8c3b4]/30 rounded-2xl shadow-xl px-4 py-3 text-xs font-black text-emerald-600">
                ✓ Conforme RGPD
              </div>
              <div className="absolute -left-6 bottom-20 bg-[#1c1c1a] rounded-2xl shadow-xl px-4 py-3">
                <div className="text-white text-xs font-black">🔒 Chiffrement E2E</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── STATS BAND ── */}
      <section className="border-y border-[#d8c3b4]/20 bg-white/50 backdrop-blur-xl py-12">
        <div className="max-w-5xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: "Cliniques actives", value: 152, suffix: "+" },
            { label: "Documents créés", value: 12000, suffix: "+" },
            { label: "Uptime garanti", value: 99, suffix: ".9%" },
            { label: "Réduction admin", value: 40, suffix: "%" },
          ].map((s) => (
            <div key={s.label} className="space-y-1">
              <div className="text-4xl font-black text-[#894d0d]"><AnimatedNumber to={s.value} suffix={s.suffix} /></div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#857467]">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-28 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#894d0d]">Tout ce dont vous avez besoin</div>
            <h2 className="text-5xl font-black tracking-tighter">Une plateforme,<br />toutes vos opérations.</h2>
            <p className="text-[#524439] text-lg font-medium max-w-xl mx-auto">De la prise de note au tableau de bord industriel, Wordex couvre l'intégralité de votre workflow clinique.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard icon="description" title="Documents collaboratifs" desc="Rédigez, annotez et partagez en temps réel. TipTap + CRDT pour une collaboration sans conflits entre équipes." />
            <FeatureCard icon="psychology" title="Agents IA intégrés" desc="Des agents spécialisés : rédaction médicale, analyse de données, génération de rapports, résumé de réunions." accent />
            <FeatureCard icon="monitoring" title="Tableaux de bord TRS/OEE" desc="Suivez la performance de vos équipements en temps réel. KPIs, AMDEC, courbes S, production tracking." />
            <FeatureCard icon="grid_view" title="Tableurs intelligents" desc="HyperFormula embarqué pour des calculs complexes. Import/export Excel, formules médicales prêtes à l'emploi." />
            <FeatureCard icon="slideshow" title="Présentations IA" desc="Générez des slides professionnelles depuis un sujet ou un document existant. Export PPTX en un clic." />
            <FeatureCard icon="timeline" title="Gantt & planning" desc="Planifiez vos projets, affectez des ressources, suivez l'avancement. Dépendances inter-tâches incluses." />
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-28 px-8 bg-white/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#894d0d]">Ils nous font confiance</div>
            <h2 className="text-5xl font-black tracking-tighter">Ce que disent nos clients</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <TestimonialCard
              quote="Wordex a transformé notre façon de gérer les protocoles. Un seul outil pour tout l'établissement, c'est un gain de temps énorme."
              name="Dr. Sarah M." role="Directrice médicale" org="Clinique Alpha"
            />
            <TestimonialCard
              quote="Le dashboard TRS nous permet de voir en temps réel l'état de nos équipements. On a réduit nos temps d'arrêt de 30% en 2 mois."
              name="Karim B." role="Responsable technique" org="Centre Médical Omega"
            />
            <TestimonialCard
              quote="L'agent IA génère nos comptes-rendus post-opératoires en quelques secondes. Notre équipe a récupéré 2h par jour."
              name="Amélie D." role="Infirmière coordinatrice" org="Hôpital Sud"
            />
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-28 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#894d0d]">Tarification transparente</div>
            <h2 className="text-5xl font-black tracking-tighter">Un plan pour chaque clinique</h2>
            <p className="text-[#524439] text-lg font-medium">Sans engagement. Annulez à tout moment. Migration gratuite depuis votre outil actuel.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 items-start">
            <PricingCard
              plan="Starter"
              price={0}
              features={["3 utilisateurs", "1 workspace", "5 documents", "Support communauté"]}
              onSelect={() => handlePlanSelect("FREE")}
            />
            <PricingCard
              plan="Pro Clinique"
              price={49}
              features={["25 utilisateurs", "Workspaces illimités", "Documents illimités", "AI agents intégrés", "Export PDF/PPTX", "Support 48h"]}
              highlighted
              badge="Le plus populaire"
              onSelect={() => handlePlanSelect("PRO")}
            />
            <PricingCard
              plan="Enterprise"
              price={199}
              features={["Utilisateurs illimités", "Multi-sites", "SSO / SAML", "RGPD + Audit logs", "SLA 99.9%", "Support dédié 24/7"]}
              onSelect={() => handlePlanSelect("ENTERPRISE")}
            />
          </div>

          {/* Enterprise CTA */}
          <div className="mt-12 bg-[#1c1c1a] rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#894d0d] mb-2">Pour les grands groupes hospitaliers</div>
              <h3 className="text-2xl font-black text-white tracking-tight">Besoin d'un devis personnalisé ?</h3>
              <p className="text-stone-400 text-sm mt-1 font-medium">Volume, intégration SI hospitalier, déploiement on-premise... parlons-en.</p>
            </div>
            <Link href="mailto:sales@wordex.io" className="shrink-0 px-8 py-4 bg-[#894d0d] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#a76526] transition-colors whitespace-nowrap">
              Contacter l'équipe →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#d8c3b4]/20 py-20 px-8">
        <div className="max-w-7xl mx-auto grid md:grid-cols-5 gap-12">
          <div className="col-span-2 space-y-6">
            <span className="text-3xl font-black text-[#894d0d] tracking-tighter">Wordex</span>
            <p className="text-[#524439] font-medium leading-relaxed text-sm max-w-xs">
              La plateforme collaborative pensée pour les professionnels de santé. Sécurisée, conforme RGPD, et conçue pour durer.
            </p>
            <div className="text-[10px] font-black uppercase tracking-widest text-[#857467]">
              🇫🇷 Hébergé en France · RGPD compliant · HDS ready
            </div>
          </div>
          {[
            { title: "Produit", links: ["Fonctionnalités", "Tarifs", "Roadmap", "Changelog"] },
            { title: "Médical", links: ["Cliniques", "Hôpitaux", "Laboratoires", "Cabinets"] },
            { title: "Légal", links: ["Confidentialité", "CGU", "RGPD", "Sécurité"] },
          ].map((col) => (
            <div key={col.title} className="space-y-4">
              <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-[#894d0d]">{col.title}</h4>
              <nav className="flex flex-col gap-3 text-xs font-bold text-[#524439]">
                {col.links.map((l) => <a key={l} href="#" className="hover:text-[#894d0d] transition-colors">{l}</a>)}
              </nav>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-[#d8c3b4]/20 flex flex-col md:flex-row justify-between items-center text-[#857467] text-[10px] font-black tracking-[0.2em] uppercase gap-3">
          <span>© 2026 Wordex SAS — Tous droits réservés</span>
          <span>Fait avec ♥ pour les soignants</span>
        </div>
      </footer>
    </div>
  );
}
