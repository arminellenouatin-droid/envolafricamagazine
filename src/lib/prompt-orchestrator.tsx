"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";

export type PromptType = "cookie" | "google-one-tap" | "pwa";
export type ActivePrompt = PromptType | null;

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface PromptOrchestratorConfig {
  delayInitialMs: number;
  delayAfterCookieMs: number;
  delayAfterOneTapMs: number;
}

export const DEFAULT_PROMPT_CONFIG: PromptOrchestratorConfig = {
  delayInitialMs: 400,
  delayAfterCookieMs: 800,
  delayAfterOneTapMs: 2000,
};

interface PromptContextType {
  activePrompt: ActivePrompt;
  authStatus: AuthStatus;
  isAuthenticated: boolean;
  user: { id: string; email?: string; nom?: string; prenom?: string } | null;
  isPromptActive: (type: PromptType) => boolean;
  completePrompt: (type: PromptType) => void;
  dismissPrompt: (type: PromptType) => void;
  markOneTapUnavailable: () => void;
  setAuthenticatedUser: (user: { id: string; email?: string; nom?: string; prenom?: string } | null) => void;
  deferredPwaPrompt: any;
  setDeferredPwaPrompt: (prompt: any) => void;
}

const PromptContext = createContext<PromptContextType | null>(null);

export function PromptProvider({
  children,
  initialUser,
  config = DEFAULT_PROMPT_CONFIG,
}: {
  children: React.ReactNode;
  initialUser?: { id: string; email?: string; nom?: string; prenom?: string } | null;
  config?: PromptOrchestratorConfig;
}) {
  const [activePrompt, setActivePrompt] = useState<ActivePrompt>(null);
  const [user, setUser] = useState<{ id: string; email?: string; nom?: string; prenom?: string } | null>(
    initialUser ?? null
  );
  const [authStatus, setAuthStatus] = useState<AuthStatus>(
    initialUser ? "authenticated" : "loading"
  );
  const [deferredPwaPrompt, setDeferredPwaPrompt] = useState<any>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const oneTapEvaluatedRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // 1. Bootstrap de la session utilisateur côté client
  useEffect(() => {
    let mounted = true;

    async function checkAuthSession() {
      if (initialUser) {
        if (mounted) setAuthStatus("authenticated");
        return;
      }

      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP error");
        const data = await res.json();
        if (mounted) {
          if (data?.user) {
            setUser(data.user);
            setAuthStatus("authenticated");
          } else {
            setUser(null);
            setAuthStatus("unauthenticated");
          }
        }
      } catch {
        if (mounted) {
          setUser(null);
          setAuthStatus("unauthenticated");
        }
      }
    }

    checkAuthSession();

    // Écoute des changements d'authentification globaux
    const handleAuthChange = () => {
      checkAuthSession();
    };
    window.addEventListener("eam_auth_changed", handleAuthChange);

    return () => {
      mounted = false;
      window.removeEventListener("eam_auth_changed", handleAuthChange);
    };
  }, [initialUser]);

  // Évaluation de la PWA
  const schedulePwaEvaluation = useCallback((delayMs: number) => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      if (typeof window === "undefined") return;

      // Vérifier si l'application est déjà en mode standalone
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes("android-app://");

      if (isStandalone) return;

      const pwaDismissed = localStorage.getItem("eam_pwa_installed_or_dismissed");
      if (pwaDismissed) return;

      const ua = navigator.userAgent || "";
      const isMobile =
        /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(ua) ||
        (navigator.maxTouchPoints > 1 && window.innerWidth <= 1024);

      if (!isMobile) return;

      setActivePrompt((current) => (current === null ? "pwa" : current));
    }, delayMs);
  }, []);

  // Évaluation de Google One Tap
  const scheduleOneTapEvaluation = useCallback(
    (delayMs: number) => {
      clearTimer();
      timerRef.current = setTimeout(() => {
        if (typeof window === "undefined") return;

        // Si l'utilisateur est connecté, passer immédiatement à la PWA
        if (authStatus === "authenticated") {
          schedulePwaEvaluation(config.delayAfterOneTapMs);
          return;
        }

        // Si l'utilisateur a fermé One Tap durant cette session
        const oneTapDismissed = sessionStorage.getItem("eam_google_prompt_dismissed");
        if (oneTapDismissed) {
          schedulePwaEvaluation(config.delayAfterOneTapMs);
          return;
        }

        oneTapEvaluatedRef.current = true;
        setActivePrompt((current) => (current === null ? "google-one-tap" : current));
      }, delayMs);
    },
    [authStatus, config.delayAfterOneTapMs, schedulePwaEvaluation]
  );

  // 2. Machine à états principale : Cookies -> One Tap -> PWA
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (authStatus === "loading") return; // Attendre la confirmation du statut d'authentification

    const cookieChoice = localStorage.getItem("eam_cookie_consent");

    if (!cookieChoice) {
      // Étape 1 : Cookies requis en priorité absolue
      clearTimer();
      timerRef.current = setTimeout(() => {
        setActivePrompt("cookie");
      }, config.delayInitialMs);
    } else {
      // Cookies déjà traités : passer à l'étape suivante
      if (authStatus === "authenticated") {
        // Déjà connecté : passer directement à l'étape PWA
        schedulePwaEvaluation(config.delayAfterOneTapMs);
      } else {
        // Non connecté : évaluer One Tap
        if (!oneTapEvaluatedRef.current) {
          scheduleOneTapEvaluation(config.delayInitialMs);
        }
      }
    }

    return () => {
      clearTimer();
    };
  }, [authStatus, config.delayInitialMs, config.delayAfterOneTapMs, scheduleOneTapEvaluation, schedulePwaEvaluation]);

  // Actions de transition
  const completePrompt = useCallback(
    (type: PromptType) => {
      setActivePrompt(null);
      clearTimer();

      if (type === "cookie") {
        // Cookies terminés -> transition vers One Tap après delayAfterCookieMs
        scheduleOneTapEvaluation(config.delayAfterCookieMs);
      } else if (type === "google-one-tap") {
        // One Tap réussi (connexion effectuée)
        setAuthStatus("authenticated");
        sessionStorage.setItem("eam_google_prompt_dismissed", "true");
        schedulePwaEvaluation(config.delayAfterOneTapMs);
      } else if (type === "pwa") {
        // PWA installée
        localStorage.setItem("eam_pwa_installed_or_dismissed", "installed");
      }
    },
    [config.delayAfterCookieMs, config.delayAfterOneTapMs, scheduleOneTapEvaluation, schedulePwaEvaluation]
  );

  const dismissPrompt = useCallback(
    (type: PromptType) => {
      setActivePrompt(null);
      clearTimer();

      if (type === "cookie") {
        // Même refusé, le consentement est géré
        scheduleOneTapEvaluation(config.delayAfterCookieMs);
      } else if (type === "google-one-tap") {
        sessionStorage.setItem("eam_google_prompt_dismissed", "true");
        schedulePwaEvaluation(config.delayAfterOneTapMs);
      } else if (type === "pwa") {
        localStorage.setItem("eam_pwa_installed_or_dismissed", "dismissed");
      }
    },
    [config.delayAfterCookieMs, config.delayAfterOneTapMs, scheduleOneTapEvaluation, schedulePwaEvaluation]
  );

  const markOneTapUnavailable = useCallback(() => {
    if (activePrompt === "google-one-tap") {
      setActivePrompt(null);
    }
    sessionStorage.setItem("eam_google_prompt_dismissed", "true");
    schedulePwaEvaluation(config.delayAfterOneTapMs);
  }, [activePrompt, config.delayAfterOneTapMs, schedulePwaEvaluation]);

  const setAuthenticatedUser = useCallback((newUser: { id: string; email?: string; nom?: string; prenom?: string } | null) => {
    setUser(newUser);
    setAuthStatus(newUser ? "authenticated" : "unauthenticated");
    if (newUser) {
      sessionStorage.setItem("eam_google_prompt_dismissed", "true");
      setActivePrompt((curr) => (curr === "google-one-tap" ? null : curr));
    }
  }, []);

  const isPromptActive = useCallback(
    (type: PromptType) => activePrompt === type,
    [activePrompt]
  );

  return (
    <PromptContext.Provider
      value={{
        activePrompt,
        authStatus,
        isAuthenticated: authStatus === "authenticated",
        user,
        isPromptActive,
        completePrompt,
        dismissPrompt,
        markOneTapUnavailable,
        setAuthenticatedUser,
        deferredPwaPrompt,
        setDeferredPwaPrompt,
      }}
    >
      {children}
    </PromptContext.Provider>
  );
}

export function usePromptOrchestrator() {
  const context = useContext(PromptContext);
  if (!context) {
    throw new Error("usePromptOrchestrator must be used within a PromptProvider");
  }
  return context;
}
