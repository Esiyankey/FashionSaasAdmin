import { CheckCircle2 } from "lucide-react";
import { ApiErrorAlert } from "./ApiErrorAlert";

interface SaveStatusProps {
  isSuccess: boolean;
  error: unknown;
  /** Shown after a successful save. */
  message?: string;
}

/** Result of a save: the server's error, or confirmation that the change was persisted. */
export function SaveStatus({ isSuccess, error, message = "Saved. The storefront updates within about a minute." }: SaveStatusProps) {
  if (error) return <ApiErrorAlert error={error} />;
  if (!isSuccess) return null;
  return (
    <p role="status" className="flex items-center gap-1.5 text-sm text-success">
      <CheckCircle2 className="size-4" />
      {message}
    </p>
  );
}
