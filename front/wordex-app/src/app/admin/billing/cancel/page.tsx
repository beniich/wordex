"use client";
import Link from "next/link";

export default function BillingCancelPage() {
  return (
    <div className="min-h-screen bg-[#fcf9f5] font-[Manrope,sans-serif] flex items-center justify-center px-8">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="h-24 w-24 mx-auto bg-stone-100 border-4 border-stone-200 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-stone-400 text-5xl">cancel</span>
        </div>
        <div className="space-y-3">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">Paiement annulé</div>
          <h1 className="text-4xl font-black tracking-tight text-[#1c1c1a]">Aucun montant prélevé</h1>
          <p className="text-[#524439] font-medium leading-relaxed">
            Vous avez annulé le paiement. Vous pouvez reprendre à tout moment ou choisir un autre plan.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link href="/admin/billing" id="billing-cancel-retry" className="bg-[#894d0d] text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#a76526] transition-colors text-center">
            Retourner aux tarifs
          </Link>
          <Link href="/dashboard" className="text-[#524439] text-sm font-medium hover:text-[#894d0d] transition-colors">
            Continuer avec le plan Free
          </Link>
        </div>
      </div>
    </div>
  );
}
