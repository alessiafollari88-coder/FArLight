import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Globe, Menu, User } from "lucide-react";
import { useLanguage } from "../i18n";
import { useAuth } from "../auth";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "../components/ui/sheet";

export const Header = () => {
  const { lang, setLang, t } = useLanguage();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "#chi-siamo", label: t.nav.about, id: "nav-about" },
    { href: "#concept", label: t.nav.concept, id: "nav-concept" },
    { href: "#piani", label: t.nav.pricing, id: "nav-pricing" },
    { href: "#consulenza", label: t.nav.consulting, id: "nav-consulting" },
    { href: "#contatti", label: t.nav.contact, id: "nav-contact" },
  ];

  const LangSelector = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          data-testid="language-selector"
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-inksoft hover:text-ink transition-colors"
          aria-label="Language"
        >
          <Globe className="w-4 h-4" strokeWidth={1.5} />
          {lang.toUpperCase()}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white border border-ink/10 rounded-sm shadow-lg">
        <DropdownMenuItem data-testid="language-option-it" onClick={() => setLang("it")} className="text-sm cursor-pointer">
          Italiano
        </DropdownMenuItem>
        <DropdownMenuItem data-testid="language-option-en" onClick={() => setLang("en")} className="text-sm cursor-pointer">
          English
        </DropdownMenuItem>
        <DropdownMenuItem data-testid="language-option-fr" onClick={() => setLang("fr")} className="text-sm cursor-pointer">
          Français
        </DropdownMenuItem>
        <DropdownMenuItem data-testid="language-option-de" onClick={() => setLang("de")} className="text-sm cursor-pointer">
          Deutsch
        </DropdownMenuItem>
        <DropdownMenuItem data-testid="language-option-es" onClick={() => setLang("es")} className="text-sm cursor-pointer">
          Español
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/40">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
        <a href="#top" data-testid="logo-link" className="font-display text-2xl font-semibold tracking-tight text-ink">
          FAr<span className="text-amberdark">Light</span>
        </a>
        <nav className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            <a key={l.id} data-testid={l.id} href={l.href} className="text-xs font-semibold uppercase tracking-[0.15em] text-inksoft hover:text-ink transition-colors">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-5">
          <LangSelector />
          {user ? (
            <Link
              to="/account"
              data-testid="account-link"
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-inksoft hover:text-ink transition-colors"
            >
              <User className="w-4 h-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">{user.name?.split(" ")[0]}</span>
            </Link>
          ) : (
            <Link
              to="/login"
              data-testid="login-link"
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-inksoft hover:text-ink transition-colors"
            >
              <User className="w-4 h-4" strokeWidth={1.5} />
              {t.auth.login}
            </Link>
          )}
          <Button
            asChild
            data-testid="header-cta-button"
            className="hidden sm:inline-flex bg-ink text-cream hover:bg-espresso rounded-sm text-xs font-semibold uppercase tracking-[0.15em] px-5 h-9"
          >
            <a href="#concept">{t.nav.cta}</a>
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button data-testid="mobile-menu-button" className="lg:hidden text-ink" aria-label="Menu">
                <Menu className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-cream border-l border-ink/10 w-72">
              <nav className="flex flex-col gap-6 mt-10">
                {links.map((l) => (
                  <a key={l.id} data-testid={`mobile-${l.id}`} href={l.href} onClick={() => setOpen(false)} className="font-display text-2xl text-ink hover:text-amberdark transition-colors">
                    {l.label}
                  </a>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
