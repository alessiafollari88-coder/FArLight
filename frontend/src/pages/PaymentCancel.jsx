import React from "react";
import { Link } from "react-router-dom";
import { XCircle } from "lucide-react";
import { useLanguage } from "../i18n";

export default function PaymentCancel() {
  const { t } = useLanguage();
  return (
    <div data-testid="payment-cancel-page" className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white border border-ink/10 rounded-sm p-12 text-center shadow-[0_8px_30px_rgba(42,39,38,0.06)]">
        <XCircle className="w-10 h-10 text-amberdark mx-auto mb-6" strokeWidth={1.5} />
        <h1 data-testid="payment-cancel-title" className="font-display text-3xl text-ink">{t.payment.cancelTitle}</h1>
        <p className="mt-4 text-sm text-inksoft leading-relaxed">{t.payment.cancelDesc}</p>
        <Link
          data-testid="payment-cancel-retry"
          to="/#piani"
          className="mt-10 inline-flex items-center bg-ink text-cream hover:bg-espresso transition-colors rounded-sm px-8 h-12 text-xs font-semibold uppercase tracking-[0.15em]"
        >
          {t.payment.retry}
        </Link>
      </div>
    </div>
  );
}
