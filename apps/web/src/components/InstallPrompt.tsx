import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isPrompting, setIsPrompting] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsPrompting(false);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt || isPrompting) return;
    const promptEvent = deferredPrompt;
    setDeferredPrompt(null);
    setIsPrompting(true);
    try {
      await promptEvent.prompt();
      await promptEvent.userChoice;
    } finally {
      setIsPrompting(false);
      setDeferredPrompt(null);
    }
  };

  const dismiss = () => setDeferredPrompt(null);

  if (!deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 shadow-lg">
        <span className="text-sm text-foreground">
          {t("pwa.installPrompt")}
        </span>
        <button
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
          onClick={install}
        >
          {t("pwa.install")}
        </button>
        <button
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={dismiss}
        >
          {t("pwa.dismiss")}
        </button>
      </div>
    </div>
  );
}
