import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useLanguage } from "../i18n";

const POSTER =
  "https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzN8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwd2FybSUyMGxpZ2h0JTIwYXJjaGl0ZWN0dXJlJTIwaW50ZXJpb3IlMjBjcmVhbXxlbnwwfHx8fDE3OTAwNzk2MDZ8MA&ixlib=rb-4.1.0&q=85";

export const Hero = () => {
  const { t } = useLanguage();
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const handlePlay = () => {
    setPlaying(true);
    videoRef.current?.play().catch(() => setVideoError(true));
  };

  return (
    <section id="top" data-testid="hero-section" className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
      <div className="absolute -top-24 -right-24 w-[480px] h-[480px] rounded-full bg-amberl/15 blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        <motion.div
          className="lg:col-span-6"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <p data-testid="hero-overline" className="text-xs uppercase tracking-[0.25em] font-semibold text-amberdark mb-6">
            {t.hero.overline}
          </p>
          <h1 data-testid="hero-title" className="font-display text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tighter leading-[0.95] text-ink">
            {t.hero.title}
          </h1>
          <p data-testid="hero-subtitle" className="mt-8 text-base sm:text-lg text-inksoft leading-relaxed max-w-xl">
            {t.hero.subtitle}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              data-testid="hero-cta-primary"
              href="#concept"
              className="inline-flex items-center bg-ink text-cream hover:bg-espresso transition-colors rounded-sm px-8 h-12 text-xs font-semibold uppercase tracking-[0.15em]"
            >
              {t.hero.ctaPrimary}
            </a>
            <a
              data-testid="hero-cta-secondary"
              href="#piani"
              className="inline-flex items-center border border-ink/20 text-ink hover:border-ink hover:bg-ink hover:text-cream transition-colors rounded-sm px-8 h-12 text-xs font-semibold uppercase tracking-[0.15em]"
            >
              {t.hero.ctaSecondary}
            </a>
          </div>
        </motion.div>

        <motion.div
          className="lg:col-span-6 lg:pl-8"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
        >
          <div data-testid="hero-video-frame" className="relative rounded-sm border border-ink/10 shadow-[0_24px_60px_rgba(42,39,38,0.12)] overflow-hidden bg-espresso">
            <div className="relative aspect-video">
              <video
                ref={videoRef}
                data-testid="hero-video"
                className="w-full h-full object-cover"
                poster={POSTER}
                controls={playing && !videoError}
                preload="metadata"
                onError={() => setVideoError(true)}
              >
                <source src="/videos/presentazione.mp4" type="video/mp4" onError={() => setVideoError(true)} />
              </video>
              {!playing && (
                <button
                  data-testid="hero-video-play"
                  onClick={handlePlay}
                  aria-label={t.hero.videoCaption}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-espresso/30 hover:bg-espresso/20 transition-colors group"
                >
                  <span className="w-16 h-16 rounded-full bg-cream/95 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <Play className="w-6 h-6 text-ink ml-1" fill="currentColor" />
                  </span>
                  <span className="text-cream text-xs font-semibold uppercase tracking-[0.2em]">
                    {videoError ? t.hero.videoSoon : t.hero.videoCaption}
                  </span>
                </button>
              )}
            </div>
          </div>
          <p data-testid="hero-founders" className="mt-4 text-xs uppercase tracking-[0.2em] text-inksoft text-right">
            {t.hero.founders}
          </p>
        </motion.div>
      </div>
    </section>
  );
};
