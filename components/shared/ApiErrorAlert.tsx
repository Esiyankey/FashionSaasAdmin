import { AlertCircle } from "lucide-react";
import { ApiError } from "@/services/http-client";
import { cn } from "@/lib/utils";

interface ApiErrorAlertProps {
  error: unknown;
  className?: string;
}

/** Shows an API error's message plus any per-field validation messages from the server. */
export function ApiErrorAlert({ error, className }: ApiErrorAlertProps) {
  if (!error) return null;
  const message = error instanceof Error ? error.message : "Something went wrong";
  const fieldErrors = error instanceof ApiError ? Object.entries(error.fieldErrors ?? {}) : [];

  return (
    <div
      role="alert"
      className={cn("flex gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive", className)}
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <div className="space-y-1">
        <p className="font-medium">{message}</p>
        {fieldErrors.length > 0 && (
          <ul className="list-disc space-y-0.5 pl-4">
            {fieldErrors.map(([field, messages]) => (
              <li key={field}>
                <span className="font-mono text-xs">{field}</span>: {messages.join(", ")}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
