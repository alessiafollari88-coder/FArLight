import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Loader2, Sparkles, LogOut, Plus, FileDown, FileText } from "lucide-react";
import { useAuth } from "../auth";
import { useLanguage } from "../i18n";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AccountPage() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(location.state?.user ? true : null);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (location.state?.user) {
      setUser(location.state.user);
      setIsAuthenticated(true);
      return;
    }
    const checkAuth = async () => {
      try {
        const res = await axios.get(`${API}/auth/me`, { withCredentials: true });
        setUser(res.data);
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
        navigate("/login");
      }
    };
    checkAuth();
  }, []);

  const loadRequests = async () => {
    try {
      const res = await axios.get(`${API}/my/requests`, { withCredentials: true });
      setRequests(res.data);
      return res.data;
    } catch {
      return [];
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadRequests();
    const interval = setInterval(async () => {
      const data = await loadRequests();
      if (data.every((r) => r.ai_status !== "generating" && r.ai_status !== "pending")) {
        clearInterval(interval);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amberdark animate-spin" strokeWidth={1.5} />
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div data-testid="account-page" className="min-h-screen bg-cream">
      <header className="border-b border-ink/10 bg-white/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          <Link to="/" data-testid="account-logo" className="font-display text-2xl font-semibold text-ink">
            FAr<span className="text-amberdark">Light</span>
          </Link>
          <div className="flex items-center gap-5">
            <span data-testid="account-user-name" className="text-sm text-inksoft hidden sm:block">{user?.name}</span>
            <button
              data-testid="logout-button"
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-inksoft hover:text-ink transition-colors"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.5} />
              {t.auth.logout}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 lg:px-12 py-16">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <h1 data-testid="account-title" className="font-display text-4xl sm:text-5xl font-medium tracking-tight text-ink">
            {t.account.title}
          </h1>
          <Link
            to="/#concept"
            data-testid="account-new-request"
            className="inline-flex items-center gap-2 bg-ink text-cream hover:bg-espresso transition-colors rounded-sm px-6 h-11 text-xs font-semibold uppercase tracking-[0.15em]"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            {t.account.newRequest}
          </Link>
        </div>

        {requests.length === 0 ? (
          <p data-testid="account-empty" className="mt-12 text-inksoft">{t.account.empty}</p>
        ) : (
          <div className="mt-12 space-y-8">
            {requests.map((r) => (
              <div key={r.id} data-testid={`request-card-${r.id}`} className="bg-white border border-ink/10 rounded-sm p-8 shadow-[0_8px_30px_rgba(42,39,38,0.04)]">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="font-display text-2xl font-medium text-ink capitalize">{r.space_type} — {r.surface} mq</h3>
                    <p className="mt-1 text-xs uppercase tracking-[0.15em] text-inksoft">
                      {t.account.submittedOn} {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-semibold bg-sand text-inksoft rounded-sm px-3 py-1.5">
                    {r.budget_range}
                  </span>
                </div>

                <div className="mt-6 border-t border-ink/10 pt-6">
                  <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold text-amberdark mb-4">
                    <Sparkles className="w-4 h-4" strokeWidth={1.5} />
                    {t.account.aiPreview}
                  </p>
                  {r.ai_status === "ready" ? (
                    <>
                      <div className="grid md:grid-cols-2 gap-6">
                        <p data-testid={`ai-text-${r.id}`} className="text-sm leading-relaxed text-inksoft whitespace-pre-line">
                          {r.ai_preview_text}
                        </p>
                        {r.ai_image_path && (
                          <img
                            data-testid={`ai-image-${r.id}`}
                            src={`${API}/files/${r.ai_image_path}`}
                            alt={t.account.aiImageAlt}
                            className="rounded-sm border border-ink/10 w-full object-cover"
                            loading="lazy"
                          />
                        )}
                      </div>
                      {r.ai_lamp_schedule && (
                        <div data-testid={`lamp-schedule-${r.id}`} className="mt-6 bg-sand/60 border border-ink/10 rounded-sm p-6">
                          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-sagedark mb-4">
                            {t.account.lampSchedule}
                          </p>
                          <p className="text-sm leading-relaxed text-inksoft whitespace-pre-line">{r.ai_lamp_schedule}</p>
                          <p className="mt-4 text-xs leading-relaxed text-inksoft/70">{t.account.lampScheduleNote}</p>
                        </div>
                      )}
                      <div className="mt-6 flex flex-wrap gap-3">
                        {r.pdf_path && (
                          <a
                            data-testid={`download-pdf-${r.id}`}
                            href={`${API}/files/${r.pdf_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-ink text-cream hover:bg-espresso transition-colors rounded-sm px-5 h-10 text-xs font-semibold uppercase tracking-[0.15em]"
                          >
                            <FileDown className="w-4 h-4" strokeWidth={1.5} />
                            {t.account.downloadPdf}
                          </a>
                        )}
                        {r.editable_path && (
                          <a
                            data-testid={`download-editable-${r.id}`}
                            href={`${API}/files/${r.editable_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 border border-ink/20 text-ink hover:border-ink transition-colors rounded-sm px-5 h-10 text-xs font-semibold uppercase tracking-[0.15em]"
                          >
                            <FileText className="w-4 h-4" strokeWidth={1.5} />
                            {t.account.downloadEditable}
                          </a>
                        )}
                      </div>
                    </>
                  ) : (
                    <p data-testid={`ai-pending-${r.id}`} className="flex items-center gap-3 text-sm text-inksoft">
                      <Loader2 className="w-4 h-4 animate-spin text-amberdark" strokeWidth={1.5} />
                      {t.account.aiGenerating}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
