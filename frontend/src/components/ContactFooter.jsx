import React, { useEffect, useState } from "react";
import axios from "axios";
import { Mail, Check } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../i18n";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const ContactFooter = () => {
  const { t } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", topic: "support", message: "" });

  useEffect(() => {
    const handler = (e) => setForm((f) => ({ ...f, topic: e.detail }));
    window.addEventListener("farlight:topic", handler);
    return () => window.removeEventListener("farlight:topic", handler);
  }, []);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target ? e.target.value : e });

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API}/contact-messages`, form);
      setDone(true);
      toast.success(t.contact.successTitle, { description: t.contact.successDesc });
    } catch (err) {
      toast.error(t.contact.errorDesc);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer id="contatti" data-testid="contact-section" className="bg-espresso text-cream">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24 grid lg:grid-cols-12 gap-12 lg:gap-16">
        <div className="lg:col-span-5">
          <p className="text-xs uppercase tracking-[0.25em] font-semibold text-amberl mb-6">{t.contact.overline}</p>
          <h2 className="font-display text-4xl sm:text-5xl font-medium tracking-tight leading-tight">{t.contact.title}</h2>
          <div className="mt-10 space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] text-cream/50">{t.contact.emailLabel}</p>
            <a
              data-testid="contact-email-link"
              href="mailto:info@farlight.it"
              className="inline-flex items-center gap-3 text-lg text-cream hover:text-amberl transition-colors"
            >
              <Mail className="w-5 h-5 text-amberl" strokeWidth={1.5} />
              info@farlight.it
            </a>
          </div>
        </div>

        <div className="lg:col-span-7">
          {done ? (
            <div data-testid="contact-success" className="border border-cream/15 rounded-sm p-12 text-center">
              <span className="inline-flex w-14 h-14 rounded-full bg-sage/20 items-center justify-center mb-6">
                <Check className="w-6 h-6 text-sage" strokeWidth={2} />
              </span>
              <h3 className="font-display text-3xl">{t.contact.successTitle}</h3>
              <p className="mt-4 text-sm text-cream/70">{t.contact.successDesc}</p>
            </div>
          ) : (
            <form data-testid="contact-form" onSubmit={submit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="ct-name" className="text-xs uppercase tracking-[0.15em] font-semibold text-cream/60">{t.contact.name}</Label>
                  <Input id="ct-name" data-testid="contact-name-input" required value={form.name} onChange={set("name")} placeholder={t.contact.namePlaceholder}
                    className="rounded-sm bg-white/5 border-cream/20 text-cream placeholder:text-cream/40 focus-visible:ring-amberl h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ct-email" className="text-xs uppercase tracking-[0.15em] font-semibold text-cream/60">{t.contact.email}</Label>
                  <Input id="ct-email" data-testid="contact-email-input" type="email" required value={form.email} onChange={set("email")} placeholder={t.contact.emailPlaceholder}
                    className="rounded-sm bg-white/5 border-cream/20 text-cream placeholder:text-cream/40 focus-visible:ring-amberl h-11" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-[0.15em] font-semibold text-cream/60">{t.contact.topic}</Label>
                <Select value={form.topic} onValueChange={(v) => set("topic")(v)}>
                  <SelectTrigger data-testid="contact-topic-select" className="rounded-sm bg-white/5 border-cream/20 text-cream focus:ring-amberl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-espresso border-cream/20 text-cream rounded-sm">
                    <SelectItem data-testid="contact-topic-support" value="support">{t.contact.topicSupport}</SelectItem>
                    <SelectItem data-testid="contact-topic-direct" value="direct">{t.contact.topicDirect}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ct-message" className="text-xs uppercase tracking-[0.15em] font-semibold text-cream/60">{t.contact.message}</Label>
                <Textarea id="ct-message" data-testid="contact-message-input" required rows={5} value={form.message} onChange={set("message")} placeholder={t.contact.messagePlaceholder}
                  className="rounded-sm bg-white/5 border-cream/20 text-cream placeholder:text-cream/40 focus-visible:ring-amberl" />
              </div>
              <button
                type="submit"
                data-testid="contact-submit-button"
                disabled={submitting}
                className="w-full bg-amberl text-espresso hover:bg-cream disabled:opacity-60 transition-colors rounded-sm h-12 text-xs font-semibold uppercase tracking-[0.15em]"
              >
                {submitting ? t.contact.submitting : t.contact.submit}
              </button>
            </form>
          )}
        </div>
      </div>
      <div className="border-t border-cream/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-display text-xl font-semibold tracking-tight">
            FAr<span className="text-amberl">Light</span>
          </p>
          <p className="text-xs text-cream/50 tracking-wide">{t.footer.tagline}</p>
          <p data-testid="footer-rights" className="text-xs text-cream/40">© {new Date().getFullYear()} FArLight — {t.footer.rights}</p>
        </div>
      </div>
    </footer>
  );
};
