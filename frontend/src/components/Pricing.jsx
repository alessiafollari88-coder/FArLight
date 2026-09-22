import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Check, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../i18n";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const Pricing = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(null);

  const checkout = async (lookupKey) => {
    setLoading(lookupKey);
    try {
      const res = await axios.post(`${API}/payments/checkout`, {
        lookup_key: lookupKey,
        origin_url: window.location.origin,
      });
      window.location.href = res.data.checkout_url;
    } catch (err) {
      toast.error(t.pricing.error);
      setLoading(null);
    }
  };

  return (
    <section id="piani" data-testid="pricing-section" className="py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <motion.div
          className="max-w-2xl"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs uppercase tracking-[0.25em] font-semibold text-amberdark mb-6">{t.pricing.overline}</p>
          <h2 className="font-display text-4xl sm:text-5xl font-medium tracking-tight leading-tight text-ink">{t.pricing.title}</h2>
          <p className="mt-5 text-base text-inksoft leading-relaxed">{t.pricing.subtitle}</p>
        </motion.div>

        <div className="mt-16 grid md:grid-cols-2 gap-8 items-stretch">
          <motion.div
            data-testid="pricing-card-occasional"
            className="bg-white border border-ink/10 rounded-sm p-10 shadow-[0_8px_30px_rgba(42,39,38,0.04)] flex flex-col"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="font-display text-3xl font-medium text-ink tracking-tight">{t.pricing.occasional.name}</h3>
            <div className="mt-6 flex items-baseline gap-3">
              <span data-testid="pricing-occasional-price" className="font-display text-5xl font-semibold text-ink">{t.pricing.occasional.price}</span>
            </div>
            <p className="mt-2 text-xs uppercase tracking-[0.15em] text-inksoft">{t.pricing.occasional.unit}</p>
            <ul className="mt-8 space-y-3 flex-1">
              {t.pricing.occasional.features.map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-inksoft">
                  <Check className="w-4 h-4 text-sagedark mt-0.5 shrink-0" strokeWidth={2} />
                  {f}
                </li>
              ))}
            </ul>
            <button
              data-testid="pricing-occasional-cta"
              onClick={() => checkout("farlight_occasional")}
              disabled={loading !== null}
              className="mt-10 w-full border border-ink text-ink hover:bg-ink hover:text-cream disabled:opacity-60 transition-colors rounded-sm h-12 text-xs font-semibold uppercase tracking-[0.15em]"
            >
              {loading === "farlight_occasional" ? t.pricing.loading : t.pricing.occasional.cta}
            </button>
          </motion.div>

          <motion.div
            data-testid="pricing-card-pro"
            className="relative bg-espresso text-cream rounded-sm p-10 shadow-[0_24px_60px_rgba(26,24,23,0.25)] flex flex-col overflow-hidden"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.12 }}
          >
            <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-amberl/20 blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-display text-3xl font-medium tracking-tight">{t.pricing.pro.name}</h3>
              <span data-testid="pricing-pro-badge" className="text-[10px] uppercase tracking-[0.2em] font-semibold bg-amberl text-espresso rounded-sm px-3 py-1.5 whitespace-nowrap">
                {t.pricing.pro.badge}
              </span>
            </div>
            <div className="mt-6 flex items-baseline gap-2">
              <span data-testid="pricing-pro-price" className="font-display text-5xl font-semibold">{t.pricing.pro.price}</span>
              <span className="text-xs uppercase tracking-[0.15em] text-cream/60">{t.pricing.pro.unit}</span>
            </div>
            <ul className="mt-8 space-y-3 flex-1">
              {t.pricing.pro.features.map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-cream/80">
                  <Check className="w-4 h-4 text-amberl mt-0.5 shrink-0" strokeWidth={2} />
                  {f}
                </li>
              ))}
            </ul>
            <button
              data-testid="pricing-pro-cta"
              onClick={() => checkout("farlight_studio_pro")}
              disabled={loading !== null}
              className="mt-10 w-full bg-amberl text-espresso hover:bg-cream disabled:opacity-60 transition-colors rounded-sm h-12 text-xs font-semibold uppercase tracking-[0.15em]"
            >
              {loading === "farlight_studio_pro" ? t.pricing.loading : t.pricing.pro.cta}
            </button>
          </motion.div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-sand border border-ink/10 rounded-sm px-6 py-5">
          <p data-testid="pricing-disclaimer" className="text-xs leading-relaxed text-inksoft max-w-2xl">
            {t.pricing.disclaimer}
          </p>
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] font-semibold text-inksoft whitespace-nowrap">
            <ShieldCheck className="w-4 h-4 text-sagedark" strokeWidth={1.5} />
            {t.pricing.secure}
          </p>
        </div>
      </div>
    </section>
  );
};
