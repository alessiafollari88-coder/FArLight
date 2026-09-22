import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "../i18n";

const HOTEL_IMG =
  "https://images.pexels.com/photos/34496713/pexels-photo-34496713.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

export const Escalation = () => {
  const { t } = useLanguage();

  const handleCta = () => {
    window.dispatchEvent(new CustomEvent("farlight:topic", { detail: "direct" }));
    document.getElementById("contatti")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="consulenza" data-testid="escalation-section" className="relative py-28 lg:py-40 overflow-hidden">
      <img src={HOTEL_IMG} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-espresso/70" />
      <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          className="max-w-2xl"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-xs uppercase tracking-[0.25em] font-semibold text-amberl mb-6">{t.escalation.overline}</p>
          <h2 className="font-display text-4xl sm:text-5xl font-medium tracking-tight leading-tight text-cream">
            {t.escalation.title}
          </h2>
          <p className="mt-6 text-base leading-relaxed text-cream/80">{t.escalation.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {t.escalation.tags.map((tag) => (
              <span key={tag} data-testid={`escalation-tag-${tag.toLowerCase().replace(/\s/g, "-")}`} className="text-xs uppercase tracking-[0.15em] font-semibold text-cream/90 border border-cream/30 rounded-sm px-4 py-2">
                {tag}
              </span>
            ))}
          </div>
          <button
            data-testid="escalation-cta"
            onClick={handleCta}
            className="mt-10 inline-flex items-center gap-3 bg-amberl text-espresso hover:bg-cream transition-colors rounded-sm px-8 h-12 text-xs font-semibold uppercase tracking-[0.15em]"
          >
            {t.escalation.cta}
            <ArrowRight className="w-4 h-4" strokeWidth={2} />
          </button>
        </motion.div>
      </div>
    </section>
  );
};
