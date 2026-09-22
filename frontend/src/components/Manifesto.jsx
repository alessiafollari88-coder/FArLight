import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../i18n";

const ARCHITECTS_IMG =
  "https://images.pexels.com/photos/8729972/pexels-photo-8729972.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

export const Manifesto = () => {
  const { t } = useLanguage();
  return (
    <section id="chi-siamo" data-testid="manifesto-section" className="py-24 lg:py-32 bg-sand">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        <motion.div
          className="lg:col-span-5"
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
        >
          <div className="relative">
            <div className="absolute -top-4 -left-4 w-full h-full border border-amberl/50 rounded-sm pointer-events-none" />
            <img
              data-testid="manifesto-image"
              src={ARCHITECTS_IMG}
              alt="Alessia e Alessandra al lavoro sulle piante"
              className="relative rounded-sm w-full aspect-[4/5] object-cover shadow-[0_24px_60px_rgba(42,39,38,0.10)]"
              loading="lazy"
            />
          </div>
        </motion.div>
        <motion.div
          className="lg:col-span-7"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <p className="text-xs uppercase tracking-[0.25em] font-semibold text-sagedark mb-6">{t.manifesto.overline}</p>
          <h2 data-testid="manifesto-title" className="font-display text-4xl sm:text-5xl font-medium tracking-tight leading-tight text-ink">
            {t.manifesto.title}
          </h2>
          <div className="mt-8 space-y-5 text-base leading-relaxed text-inksoft max-w-2xl">
            <p data-testid="manifesto-p1">{t.manifesto.p1}</p>
            <p data-testid="manifesto-p2">{t.manifesto.p2}</p>
            <p data-testid="manifesto-p3">{t.manifesto.p3}</p>
          </div>
          <div className="mt-10 border-l-2 border-amberl pl-6">
            <p className="font-display italic text-2xl text-ink">{t.manifesto.signature}</p>
            <p className="text-xs uppercase tracking-[0.2em] text-inksoft mt-1">{t.manifesto.signatureRole}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
