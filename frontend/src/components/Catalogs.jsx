import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Check, Send } from "lucide-react";
import { useLanguage } from "../i18n";

const BRANDS = [
  { name: "Flos", url: "https://flos.com", desc: { it: "Icone del design italiano", en: "Italian design icons" } },
  { name: "Artemide", url: "https://www.artemide.com", desc: { it: "The Human Light", en: "The Human Light" } },
  { name: "Foscarini", url: "https://www.foscarini.com", desc: { it: "Lampade decorative d'autore", en: "Authorial decorative lamps" } },
  { name: "Luceplan", url: "https://www.luceplan.com", desc: { it: "Innovazione tecnologica", en: "Technological innovation" } },
  { name: "Nemo Lighting", url: "https://www.nemolighting.com", desc: { it: "Maestri del Novecento", en: "Masters of the 20th century" } },
  { name: "Vibia", url: "https://vibia.com", desc: { it: "Atmosfere su misura", en: "Tailored atmospheres" } },
  { name: "Delta Light", url: "https://www.deltalight.com", desc: { it: "Illuminazione architetturale", en: "Architectural lighting" } },
  { name: "iGuzzini", url: "https://www.iguzzini.com", desc: { it: "Luce per l'architettura", en: "Light for architecture" } },
  { name: "Louis Poulsen", url: "https://www.louispoulsen.com", desc: { it: "Design scandinavo dal 1874", en: "Scandinavian design since 1874" } },
  { name: "Occhio", url: "https://www.occhio.com", desc: { it: "Sistemi luminosi modulari", en: "Modular lighting systems" } },
  { name: "FontanaArte", url: "https://www.fontanaarte.com" },
  { name: "Martinelli Luce", url: "https://www.martinelliluce.it" },
  { name: "Catellani & Smith", url: "https://www.catellanismith.com" },
  { name: "Davide Groppi", url: "https://www.davidegroppi.com" },
  { name: "Karman", url: "https://www.karmanitalia.it" },
  { name: "Slamp", url: "https://www.slamp.com" },
  { name: "Moooi", url: "https://www.moooi.com" },
  { name: "Tom Dixon", url: "https://www.tomdixon.net" },
  { name: "Marset", url: "https://www.marset.com" },
  { name: "Bover", url: "https://bover.es" },
  { name: "Estiluz", url: "https://www.estiluz.com" },
  { name: "Fabbian", url: "https://www.fabbian.com" },
  { name: "Panzeri", url: "https://www.panzeri.it" },
  { name: "Axolight", url: "https://www.axolight.it" },
  { name: "Linea Light", url: "https://www.linealight.com" },
  { name: "Zafferano", url: "https://www.zafferanoitalia.com" },
  { name: "Contardi", url: "https://contardi-lighting.it" },
  { name: "Platek", url: "https://www.platek.eu" },
  { name: "SIMES", url: "https://www.simes.it" },
  { name: "Targetti", url: "https://www.targetti.com" },
  { name: "ERCO", url: "https://www.erco.com" },
  { name: "Zumtobel", url: "https://www.zumtobel.com" },
];

export const Catalogs = () => {
  const { lang, t } = useLanguage();
  const [selected, setSelected] = useState([]);

  const toggle = (name) =>
    setSelected((prev) => (prev.includes(name) ? prev.filter((b) => b !== name) : [...prev, name]));

  const sendToRequest = () => {
    window.dispatchEvent(new CustomEvent("farlight:brands", { detail: selected }));
    document.getElementById("concept")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="cataloghi" data-testid="catalogs-section" className="py-24 lg:py-32 bg-sand/60">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          className="max-w-2xl"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs uppercase tracking-[0.25em] font-semibold text-sagedark mb-6">{t.catalogs.overline}</p>
          <h2 className="font-display text-4xl sm:text-5xl font-medium tracking-tight leading-tight text-ink">
            {t.catalogs.title}
          </h2>
          <p className="mt-5 text-base text-inksoft leading-relaxed">{t.catalogs.subtitle}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.15em] font-semibold text-amberdark">{t.catalogs.selectHint}</p>
        </motion.div>

        <div className="mt-14 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {BRANDS.map((brand, i) => {
            const isSelected = selected.includes(brand.name);
            return (
              <motion.div
                key={brand.name}
                data-testid={`catalog-brand-${brand.name.toLowerCase().replace(/[\s&]/g, "-")}`}
                onClick={() => toggle(brand.name)}
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && toggle(brand.name)}
                className={`group relative cursor-pointer bg-white border rounded-sm p-5 transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_30px_rgba(42,39,38,0.04)] ${
                  isSelected ? "border-amberdark bg-amberl/10" : "border-ink/10 hover:border-amberdark"
                }`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: (i % 5) * 0.05 }}
              >
                {isSelected && (
                  <span data-testid={`catalog-selected-${brand.name.toLowerCase().replace(/[\s&]/g, "-")}`} className="absolute top-3 left-3 w-5 h-5 rounded-full bg-amberdark flex items-center justify-center">
                    <Check className="w-3 h-3 text-cream" strokeWidth={3} />
                  </span>
                )}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-lg font-medium text-ink tracking-tight">{brand.name}</h3>
                  <a
                    data-testid={`catalog-visit-${brand.name.toLowerCase().replace(/[\s&]/g, "-")}`}
                    href={brand.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${brand.name} — ${t.catalogs.visit}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-inksoft hover:text-amberdark transition-colors shrink-0 mt-1"
                  >
                    <ArrowUpRight className="w-4 h-4" strokeWidth={1.5} />
                  </a>
                </div>
                {brand.desc && (
                  <p className="mt-2 text-xs leading-relaxed text-inksoft">{brand.desc[lang] || brand.desc.en}</p>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p data-testid="catalogs-note" className="text-xs text-inksoft/70 max-w-xl">{t.catalogs.note}</p>
          {selected.length > 0 && (
            <button
              data-testid="catalogs-add-to-request"
              onClick={sendToRequest}
              className="inline-flex items-center gap-3 bg-ink text-cream hover:bg-espresso transition-colors rounded-sm px-7 h-12 text-xs font-semibold uppercase tracking-[0.15em] whitespace-nowrap"
            >
              <Send className="w-4 h-4" strokeWidth={1.5} />
              {t.catalogs.addToRequest} ({selected.length})
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
