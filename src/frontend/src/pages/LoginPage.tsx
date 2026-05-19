import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  BarChart3,
  FlaskConical,
  Shield,
} from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "../hooks/use-auth";

const FEATURES = [
  {
    icon: <Activity className="w-5 h-5" />,
    title: "Activity Logging",
    desc: "Track ongoing & retroactive R&D activities with IRC §41 classification",
  },
  {
    icon: <FlaskConical className="w-5 h-5" />,
    title: "Experiment Tracking",
    desc: "Log hypotheses, methods, metrics, and outcomes for each R&D experiment",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Four-Part Test",
    desc: "Automated IRC §41 four-part test scoring with quantum-adjusted confidence",
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: "QRE Reports",
    desc: "Generate export-ready reports with estimated tax credit values",
  },
];

export function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <div
        className="relative flex-1 flex flex-col items-center justify-center px-6 py-16 text-center overflow-hidden"
        style={{ minHeight: "60vh" }}
      >
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage:
              "url(/assets/generated/hero-qre-dark.dim_1200x400.jpg)",
          }}
          aria-hidden="true"
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background"
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 mb-6">
            <span className="font-score text-xs text-primary font-semibold tracking-widest">
              IRC §41 COMPLIANCE
            </span>
          </div>
          <h1 className="font-score text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-4">
            QRE-Agent Platform
          </h1>
          <p className="text-lg text-muted-foreground mb-2 font-score">
            Sovereign R&D Tax Credit Tracking System
          </p>
          <p className="text-sm text-muted-foreground/70 mb-10 max-w-lg mx-auto">
            Deterministic IRC §41 scoring, quantum-adjusted eligibility, and
            tamper-evident audit trails — deployed on the Internet Computer.
          </p>

          <Button
            onClick={() => login()}
            disabled={isLoading}
            data-ocid="login.primary_button"
            size="lg"
            className="gap-2 font-score"
          >
            {isLoading ? "Initializing..." : "Sign in with Internet Identity"}
            <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="mt-4 text-xs text-muted-foreground/50">
            Passwordless authentication via DFINITY Internet Identity
          </p>
        </div>
      </div>

      {/* Features */}
      <section className="bg-card border-t border-border px-6 py-14">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs font-score font-semibold text-muted-foreground tracking-widest uppercase mb-10">
            Platform Capabilities
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="p-4 rounded-lg border border-border bg-secondary/30"
              >
                <div className="w-9 h-9 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
                  {f.icon}
                </div>
                <h3 className="font-score text-sm font-semibold text-foreground mb-1">
                  {f.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border px-6 py-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground/60">
          <span className="font-score">
            InfluWealth Consult LLC — QRE-Agent v1.0
          </span>
          <span>
            {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-muted-foreground transition-smooth"
            >
              caffeine.ai
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
