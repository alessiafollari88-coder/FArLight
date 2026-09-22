import React, { useRef, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Upload, Check, X } from "lucide-react";
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

export const ConceptForm = () => {
  const { t } = useLanguage();
  const fileRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", space_type: "", surface: "", ceiling_height: "",
    budget_range: "", light_style: "", notes: "",
  });

  const set = (key) => (e) => setForm({ ...form, [key]: e.target ? e.target.value : e });

  const onFiles = (e) => setFiles(Array.from(e.target.files || []));

  const removeFile = (idx) => setFiles(files.filter((_, i) => i !== idx));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      files.forEach((f) => data.append("files", f));
      await axios.post(`${API}/concept-requests`, data);
      setDone(true);
      toast.success(t.form.successTitle, { description: t.form.successDesc });
    } catch (err) {
      toast.error(t.form.errorDesc);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="concept" data-testid="concept-section" className="py-24 lg:py-32 bg-sand">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-12 gap-12 lg:gap-16">
        <motion.div
          className="lg:col-span-5"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs uppercase tracking-[0.25em] font-semibold text-sagedark mb-6">{t.form.overline}</p>
          <h2 className="font-display text-4xl sm:text-5xl font-medium tracking-tight leading-tight text-ink">
            {t.form.title}
          </h2>
          <p className="mt-8 text-xs uppercase tracking-[0.2em] font-semibold text-inksoft">{t.form.leftTitle}</p>
          <ol className="mt-5 space-y-4">
            {t.form.steps.map((step, i) => (
              <li key={i} data-testid={`concept-step-${i}`} className="flex items-start gap-4">
                <span className="font-display text-2xl text-amberdark leading-none">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-sm leading-relaxed text-inksoft pt-1">{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-10 text-xs leading-relaxed text-inksoft/80 border-l-2 border-sage pl-4">
            {t.form.disclaimerShort}
          </p>
        </motion.div>

        <motion.div
          className="lg:col-span-7"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          {done ? (
            <div data-testid="concept-success" className="bg-white rounded-sm border border-ink/10 p-12 shadow-[0_8px_30px_rgba(42,39,38,0.04)] text-center">
              <span className="inline-flex w-14 h-14 rounded-full bg-sage/15 items-center justify-center mb-6">
                <Check className="w-6 h-6 text-sagedark" strokeWidth={2} />
              </span>
              <h3 className="font-display text-3xl text-ink">{t.form.successTitle}</h3>
              <p className="mt-4 text-sm text-inksoft leading-relaxed max-w-md mx-auto">{t.form.successDesc}</p>
            </div>
          ) : (
            <form
              data-testid="concept-form"
              onSubmit={submit}
              className="bg-white rounded-sm border border-ink/10 p-8 sm:p-10 shadow-[0_8px_30px_rgba(42,39,38,0.04)] space-y-6"
            >
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="cf-name" className="text-xs uppercase tracking-[0.15em] font-semibold text-inksoft">{t.form.name}</Label>
                  <Input id="cf-name" data-testid="concept-name-input" required value={form.name} onChange={set("name")} placeholder={t.form.namePlaceholder} className="rounded-sm border-ink/15 focus-visible:ring-amberl h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cf-email" className="text-xs uppercase tracking-[0.15em] font-semibold text-inksoft">{t.form.email}</Label>
                  <Input id="cf-email" data-testid="concept-email-input" type="email" required value={form.email} onChange={set("email")} placeholder={t.form.emailPlaceholder} className="rounded-sm border-ink/15 focus-visible:ring-amberl h-11" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.15em] font-semibold text-inksoft">{t.form.spaceType}</Label>
                  <Select required value={form.space_type} onValueChange={(v) => set("space_type")(v)}>
                    <SelectTrigger data-testid="concept-space-type-select" className="rounded-sm border-ink/15 focus:ring-amberl h-11">
                      <SelectValue placeholder={t.form.spaceTypePlaceholder} />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-sm border-ink/10">
                      {Object.entries(t.form.spaceTypes).map(([k, v]) => (
                        <SelectItem key={k} data-testid={`concept-space-${k}`} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.15em] font-semibold text-inksoft">{t.form.budget}</Label>
                  <Select required value={form.budget_range} onValueChange={(v) => set("budget_range")(v)}>
                    <SelectTrigger data-testid="concept-budget-select" className="rounded-sm border-ink/15 focus:ring-amberl h-11">
                      <SelectValue placeholder={t.form.budgetPlaceholder} />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-sm border-ink/10">
                      {Object.entries(t.form.budgets).map(([k, v]) => (
                        <SelectItem key={k} data-testid={`concept-budget-${k}`} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="cf-surface" className="text-xs uppercase tracking-[0.15em] font-semibold text-inksoft">{t.form.surface}</Label>
                  <Input id="cf-surface" data-testid="concept-surface-input" type="number" step="0.5" min="1" required value={form.surface} onChange={set("surface")} placeholder={t.form.surfacePlaceholder} className="rounded-sm border-ink/15 focus-visible:ring-amberl h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cf-ceiling" className="text-xs uppercase tracking-[0.15em] font-semibold text-inksoft">{t.form.ceiling}</Label>
                  <Input id="cf-ceiling" data-testid="concept-ceiling-input" type="number" step="0.05" min="1" required value={form.ceiling_height} onChange={set("ceiling_height")} placeholder={t.form.ceilingPlaceholder} className="rounded-sm border-ink/15 focus-visible:ring-amberl h-11" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cf-style" className="text-xs uppercase tracking-[0.15em] font-semibold text-inksoft">{t.form.style}</Label>
                <Input id="cf-style" data-testid="concept-style-input" required value={form.light_style} onChange={set("light_style")} placeholder={t.form.stylePlaceholder} className="rounded-sm border-ink/15 focus-visible:ring-amberl h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-[0.15em] font-semibold text-inksoft">{t.form.upload}</Label>
                <input ref={fileRef} type="file" multiple accept=".pdf,.dwg,.jpg,.jpeg,.png" onChange={onFiles} className="hidden" data-testid="concept-file-input" />
                <button
                  type="button"
                  data-testid="concept-upload-button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full border border-dashed border-ink/25 hover:border-amberdark rounded-sm p-6 flex flex-col items-center gap-2 transition-colors bg-cream/50"
                >
                  <Upload className="w-5 h-5 text-amberdark" strokeWidth={1.5} />
                  <span className="text-sm font-semibold text-ink">{t.form.uploadButton}</span>
                  <span className="text-xs text-inksoft">{t.form.uploadHint}</span>
                </button>
                {files.length > 0 && (
                  <ul data-testid="concept-file-list" className="space-y-2 pt-2">
                    {files.map((f, i) => (
                      <li key={i} className="flex items-center justify-between text-sm bg-sand rounded-sm px-4 py-2">
                        <span className="truncate text-ink">{f.name}</span>
                        <button type="button" data-testid={`concept-file-remove-${i}`} onClick={() => removeFile(i)} aria-label="Rimuovi" className="text-inksoft hover:text-ink ml-3">
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cf-notes" className="text-xs uppercase tracking-[0.15em] font-semibold text-inksoft">{t.form.notes}</Label>
                <Textarea id="cf-notes" data-testid="concept-notes-input" rows={4} value={form.notes} onChange={set("notes")} placeholder={t.form.notesPlaceholder} className="rounded-sm border-ink/15 focus-visible:ring-amberl" />
              </div>
              <button
                type="submit"
                data-testid="concept-submit-button"
                disabled={submitting}
                className="w-full bg-ink text-cream hover:bg-espresso disabled:opacity-60 transition-colors rounded-sm h-12 text-xs font-semibold uppercase tracking-[0.15em]"
              >
                {submitting ? t.form.submitting : t.form.submit}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
};
