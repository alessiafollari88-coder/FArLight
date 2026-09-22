import React from "react";
import { motion } from "framer-motion";
import { Clock, Sun, LayoutGrid, Wallet } from "lucide-react";
import { useLanguage } from "../i18n";

const ICONS = [Clock, Sun, LayoutGrid, Wallet];

export const Strengths = () => {
  const { t } = useLanguage();
  return (
    <section data-testid="strengths-section" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          className="max-w-2xl"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs uppercase tracking-[0.25em] font-semibold text-amberdark mb-6">{t.strengths.overline}</p>
          <h2 className="font-display text-4xl sm:text-5xl font-medium tracking-tight leading-tight text-ink">
            {t.strengths.title}
          </h2>
        </motion.div>
        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {t.strengths.items.map((item, i) => {
            const Icon = ICONS[i];
            return (
              <motion.div
                key={item.title}
                data-testid={`strength-card-${i}`}
                className="bg-white border border-ink/10 rounded-sm p-8 shadow-[0_8px_30px_rgba(42,39,38,0.04)] hover:shadow-[0_16px_40px_rgba(42,39,38,0.08)] hover:-translate-y-1 transition-all duration-300"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <span className="inline-flex w-11 h-11 rounded-sm bg-sand items-center justify-center mb-6">
                  <Icon className="w-5 h-5 text-amberdark" strokeWidth={1.5} />
                </span>
                <h3 className="font-display text-2xl font-medium text-ink tracking-tight">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-inksoft">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
