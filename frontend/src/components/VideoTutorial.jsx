import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useLanguage } from "../i18n";

const POSTER =
  "https://images.unsplash.com/photo-1622651491473-ff3824d12768?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzN8MHwxfHNlYXJjaHw0fHxtaW5pbWFsaXN0JTIwd2FybSUyMGxpZ2h0JTIwYXJjaGl0ZWN0dXJlJTIwaW50ZXJpb3IlMjBjcmVhbXxlbnwwfHx8fDE3OTAwNzk2MDZ8MA&ixlib=rb-4.1.0&q=85";

export const VideoTutorial = () => {
  const { t } = useLanguage();
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const handlePlay = () => {
    setPlaying(true);
    videoRef.current?.play().catch(() => setVideoError(true));
  };

  return (
    <section id="tutorial" data-testid="tutorial-section" className="py-24 lg:py-32 bg-sand/60">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        <motion.div
          className="lg:col-span-5 order-2 lg:order-1"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <div data-testid="tutorial-video-frame" className="relative rounded-sm border border-ink/10 shadow-[0_24px_60px_rgba(42,39,38,0.12)] overflow-hidden bg-espresso">
            <div className="relative aspect-video">
              <video
                ref={videoRef}
                data-testid="tutorial-video"
                className="w-full h-full object-cover"
                poster={POSTER}
                controls={playing && !videoError}
                preload="metadata"
                onError={() => setVideoError(true)}
              >
                <source src="/videos/tutorial.mp4" type="video/mp4" onError={() => setVideoError(true)} />
              </video>
              {!playing && (
                <button
                  data-testid="tutorial-video-play"
                  onClick={handlePlay}
                  aria-label={t.tutorial.videoCaption}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-espresso/30 hover:bg-espresso/20 transition-colors group"
                >
                  <span className="w-16 h-16 rounded-full bg-cream/95 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <Play className="w-6 h-6 text-ink ml-1" fill="currentColor" />
                  </span>
                  <span className="text-cream text-xs font-semibold uppercase tracking-[0.2em]">
                    {videoError ? t.tutorial.videoSoon : t.tutorial.videoCaption}
                  </span>
                </button>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="lg:col-span-7 order-1 lg:order-2"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs uppercase tracking-[0.25em] font-semibold text-amberdark mb-6">{t.tutorial.overline}</p>
          <h2 data-testid="tutorial-title" className="font-display text-4xl sm:text-5xl font-medium tracking-tight leading-tight text-ink">
            {t.tutorial.title}
          </h2>
          <p className="mt-5 text-base text-inksoft leading-relaxed max-w-xl">{t.tutorial.subtitle}</p>
          <ol className="mt-10 space-y-6">
            {t.tutorial.steps.map((step, i) => (
              <li key={i} data-testid={`tutorial-step-${i}`} className="flex items-start gap-5">
                <span className="font-display text-3xl text-amberdark leading-none shrink-0 w-10">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-ink">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-inksoft">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </motion.div>
      </div>
    </section>
  );
};
