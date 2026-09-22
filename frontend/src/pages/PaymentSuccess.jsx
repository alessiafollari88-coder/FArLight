import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { useLanguage } from "../i18n";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PaymentSuccess() {
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState("pending");

  useEffect(() => {
    if (!sessionId) {
      setStatus("failed");
      return;
    }
    let attempts = 0;
    const poll = async () => {
      try {
        const res = await axios.get(`${API}/payments/status/${sessionId}`);
        if (res.data.payment_status === "paid") {
          setStatus("paid");
          return;
        }
      } catch (e) {
        // keep polling on transient errors
      }
      attempts += 1;
      if (attempts < 15) {
        setTimeout(poll, 2000);
      } else {
        setStatus("failed");
      }
    };
    poll();
  }, [sessionId]);

  return (
    <div data-testid="payment-success-page" className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white border border-ink/10 rounded-sm p-12 text-center shadow-[0_8px_30px_rgba(42,39,38,0.06)]">
        {status === "pending" && (
          <>
            <Loader2 data-testid="payment-pending-icon" className="w-10 h-10 text-amberdark animate-spin mx-auto mb-6" strokeWidth={1.5} />
            <h1 className="font-display text-3xl text-ink">{t.payment.pendingTitle}</h1>
            <p className="mt-4 text-sm text-inksoft">{t.payment.pendingDesc}</p>
          </>
        )}
        {status === "paid" && (
          <>
            <span className="inline-flex w-14 h-14 rounded-full bg-sage/15 items-center justify-center mb-6">
              <Check data-testid="payment-success-icon" className="w-6 h-6 text-sagedark" strokeWidth={2} />
            </span>
            <h1 data-testid="payment-success-title" className="font-display text-3xl text-ink">{t.payment.successTitle}</h1>
            <p className="mt-4 text-sm text-inksoft leading-relaxed">{t.payment.successDesc}</p>
          </>
        )}
        {status === "failed" && (
          <>
            <AlertCircle data-testid="payment-failed-icon" className="w-10 h-10 text-amberdark mx-auto mb-6" strokeWidth={1.5} />
            <h1 className="font-display text-3xl text-ink">{t.payment.failedTitle}</h1>
            <p className="mt-4 text-sm text-inksoft leading-relaxed">{t.payment.failedDesc}</p>
          </>
        )}
        <Link
          data-testid="payment-back-home"
          to="/"
          className="mt-10 inline-flex items-center bg-ink text-cream hover:bg-espresso transition-colors rounded-sm px-8 h-12 text-xs font-semibold uppercase tracking-[0.15em]"
        >
          {t.payment.backHome}
        </Link>
      </div>
    </div>
  );
}
