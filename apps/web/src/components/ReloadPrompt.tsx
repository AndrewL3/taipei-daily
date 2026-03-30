import { useTranslation } from "react-i18next";
import { useRegisterSW } from "virtual:pwa-register/react";

export default function ReloadPrompt() {
  const { t } = useTranslation();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW();

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 shadow-lg">
        <span className="text-sm text-foreground">
          {offlineReady ? t("pwa.offlineReady") : t("pwa.newVersion")}
        </span>
        {needRefresh && (
          <button
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            onClick={() => updateServiceWorker(true)}
          >
            {t("pwa.reload")}
          </button>
        )}
        <button
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={close}
        >
          {t("pwa.dismiss")}
        </button>
      </div>
    </div>
  );
}
