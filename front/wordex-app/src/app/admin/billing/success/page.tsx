"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function BillingSuccessContent() {
  const params = useSearchParams();
  const plan = params.get("plan") || "Pro";

  return (
    <div className="min-h-screen bg-[#fcf9f5] font-[Manrope,sans-serif] flex items-center justify-center px-8">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon */}
        <div className="h-24 w-24 mx-auto bg-emerald-50 border-4 border-emerald-200 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-emerald-500 text-5xl">check_circle</span>
        </div>

        {/* Text */}
        <div className="space-y-3">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Paiement confirmé</div>
          <h1 className="text-4xl font-black tracking-tight text-[#1c1c1a]">Bienvenue dans le plan {plan} !</h1>
          <p className="text-[#524439] font-medium leading-relaxed">
            Votre abonnement est actif. Toutes vos fonctionnalités sont maintenant disponibles.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link href="/dashboard" id="billing-success-cta" className="bg-[#894d0d] text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#a76526] transition-colors text-center">
            Accéder au dashboard →
          </Link>
          <Link href="/admin/billing" className="text-[#524439] text-sm font-medium hover:text-[#894d0d] transition-colors">
            Gérer mon abonnement
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fcf9f5] flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-[#894d0d] border-t-transparent rounded-full" /></div>}>
      <BillingSuccessContent />
    </Suspense>
  );
}
