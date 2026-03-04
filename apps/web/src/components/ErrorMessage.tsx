import { AlertCircle, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";

interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorMessage({
  message,
  onRetry,
}: ErrorMessageProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
      <AlertCircle className="text-destructive h-8 w-8" />
      <p className="text-muted-foreground text-sm">{message ?? t("error.somethingWentWrong")}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {t("error.retry")}
        </Button>
      )}
    </div>
  );
}
