import React from "react";
import { Header } from "../components/Header";
import { Hero } from "../components/Hero";
import { Manifesto } from "../components/Manifesto";
import { Strengths } from "../components/Strengths";
import { VideoTutorial } from "../components/VideoTutorial";
import { ConceptForm } from "../components/ConceptForm";
import { Catalogs } from "../components/Catalogs";
import { Pricing } from "../components/Pricing";
import { Escalation } from "../components/Escalation";
import { ContactFooter } from "../components/ContactFooter";

export default function HomePage() {
  return (
    <div data-testid="home-page" className="min-h-screen bg-cream">
      <Header />
      <main>
        <Hero />
        <Manifesto />
        <Strengths />
        <VideoTutorial />
        <ConceptForm />
        <Catalogs />
        <Pricing />
        <Escalation />
      </main>
      <ContactFooter />
    </div>
  );
}
