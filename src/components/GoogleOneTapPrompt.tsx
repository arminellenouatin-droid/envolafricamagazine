"use client";

import { useEffect, useCallback, useRef } from "react";
import { usePromptOrchestrator } from "@/lib/prompt-orchestrator";

interface GoogleOneTapPromptProps {
  user?: { id: string } | null;
}

export default function GoogleOneTapPrompt({ user: propUser }: GoogleOneTapPromptProps) {
  const {
    isPromptActive,
    completePrompt,
    dismissPrompt,
    markOneTapUnavailable,
    setAuthenticatedUser,
    isAuthenticated,
    user: contextUser,
  } = usePromptOrchestrator();

  const isConnected = Boolean(propUser || contextUser || isAuthenticated);
  const isActive = isPromptActive("google-one-tap");
  const gisInitializedRef = useRef(false);

  const handleCredentialResponse = useCallback(
    async (response: { credential?: string }) => {
      if (!response.credential) return;

      if (process.env.NODE_ENV !== "production") {
        console.log("[AUTH][ONE_TAP] credential received");
        console.log("[AUTH][ONE_TAP] API request started");
      }

      try {
        const currentPath =
          typeof window !== "undefined"
            ? window.location.pathname + window.location.search
            : "/";

        const res = await fetch("/api/auth/google-one-tap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential, next: currentPath }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok && data.success) {
          // Cas de vérification 2FA requise
          if (data.twoFactorRequired && data.redirectUrl) {
            window.location.assign(data.redirectUrl);
            return;
          }

          if (process.env.NODE_ENV !== "production") {
            console.log("[AUTH][ONE_TAP] user authenticated");
            console.log("[AUTH][ONE_TAP] authentication finalized");
          }

          // Inscription locale immédiate pour éviter tout réaffichage
          setAuthenticatedUser(data.user);
          completePrompt("google-one-tap");

          // Nettoyage Google Identity Services
          try {
            const google = (window as unknown as {
              google?: {
                accounts?: {
                  id?: {
                    cancel: () => void;
                    disableAutoSelect: () => void;
                  };
                };
              };
            }).google;
            google?.accounts?.id?.cancel();
            google?.accounts?.id?.disableAutoSelect();
          } catch {}

          if (typeof window !== "undefined") {
            sessionStorage.setItem("eam_google_prompt_dismissed", "true");
            window.dispatchEvent(new Event("eam_auth_changed"));
            // Navigation fluide vers la destination
            window.location.assign(data.redirectUrl || window.location.href);
          }
          return;
        }

        if (data.error) {
          if (process.env.NODE_ENV !== "production") {
            console.warn("[AUTH][ONE_TAP] Erreur serveur:", data.error);
          }
          dismissPrompt("google-one-tap");
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[AUTH][ONE_TAP] Exception:", err);
        }
        dismissPrompt("google-one-tap");
      }
    },
    [completePrompt, dismissPrompt, setAuthenticatedUser]
  );

  useEffect(() => {
    // Si l'utilisateur est connecté ou que le prompt n'est pas actif selon l'orchestrateur
    if (isConnected || !isActive) {
      // Nettoyage préventif
      try {
        const google = (window as unknown as {
          google?: { accounts?: { id?: { cancel: () => void } } };
        }).google;
        google?.accounts?.id?.cancel();
      } catch {}
      return;
    }

    if (typeof window === "undefined") return;

    const googleClientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "").trim();
    if (!googleClientId) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[AUTH][ONE_TAP] NEXT_PUBLIC_GOOGLE_CLIENT_ID non configuré");
      }
      markOneTapUnavailable();
      return;
    }

    // Initialiser Google Identity Services
    const initGsi = () => {
      if (gisInitializedRef.current) return;

      const google = (window as unknown as {
        google?: {
          accounts?: {
            id?: {
              initialize: (config: unknown) => void;
              prompt: (cb?: (notification: {
                isNotDisplayed: () => boolean;
                isSkipped: () => boolean;
                isDismissed: () => boolean;
                getNotDisplayedReason?: () => string;
              }) => void) => void;
              cancel: () => void;
            };
          };
        };
      }).google;

      if (google?.accounts?.id) {
        gisInitializedRef.current = true;
        google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed()) {
            if (process.env.NODE_ENV !== "production") {
              console.log(
                "[AUTH][ONE_TAP] Prompt GIS non affiché nativement:",
                notification.getNotDisplayedReason?.()
              );
            }
            // GIS ne peut pas être affiché nativement : passer proprement à l'étape suivante (PWA)
            markOneTapUnavailable();
          } else if (notification.isSkipped() || notification.isDismissed()) {
            if (process.env.NODE_ENV !== "production") {
              console.log("[AUTH][ONE_TAP] Prompt GIS fermé ou ignoré");
            }
            dismissPrompt("google-one-tap");
          }
        });
      }
    };

    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    );

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGsi;
      script.onerror = () => {
        markOneTapUnavailable();
      };
      document.head.appendChild(script);
    } else {
      initGsi();
    }

    return () => {
      try {
        const google = (window as unknown as {
          google?: { accounts?: { id?: { cancel: () => void } } };
        }).google;
        google?.accounts?.id?.cancel();
      } catch {}
    };
  }, [isConnected, isActive, handleCredentialResponse, dismissPrompt, markOneTapUnavailable]);

  // Google Identity Services affiche son propre composant One Tap natif via son iframe.
  return null;
}
