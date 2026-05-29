import { MailCheck } from "lucide-react";

import type { EmailLogItem } from "@/lib/receptionist/types";
import { cn } from "@/lib/utils";

type EmailLogProps = {
  emails: EmailLogItem[];
  compact?: boolean;
  className?: string;
};

export function EmailLog({
  emails,
  compact = false,
  className,
}: EmailLogProps) {
  const visibleEmails = compact ? emails.slice(0, 2) : emails;

  return (
    <section
      className={cn(
        "glass shadow-elegant border-border/60 overflow-hidden rounded-xl border",
        className,
      )}
    >
      <header
        className={cn(
          "border-border/50 flex items-center gap-3 border-b",
          compact ? "px-4 py-3" : "px-5 py-4",
        )}
      >
        <MailCheck className="text-sage size-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold">Emails de cita</p>
          <p className="text-xs text-zinc-500">Confirmaciones y cambios</p>
        </div>
      </header>

      <div className={cn("space-y-3", compact ? "px-4 py-3" : "px-5 py-5")}>
        {emails.length === 0 ? (
          <p
            className={cn(
              "text-sm text-zinc-500",
              compact ? "leading-5" : "leading-6",
            )}
          >
            Los emails apareceran aqui al confirmar, modificar o cancelar citas.
          </p>
        ) : (
          visibleEmails.map((email) => (
            <article
              key={email.id}
              className={cn("bg-muted rounded-lg", compact ? "p-3" : "p-4")}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium">{email.subject}</p>
                <span className="text-sage text-xs font-semibold uppercase">
                  {email.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">{email.recipient}</p>
            </article>
          ))
        )}
        {compact && emails.length > visibleEmails.length ? (
          <p className="text-muted-foreground text-xs">
            +{emails.length - visibleEmails.length} emails anteriores
          </p>
        ) : null}
      </div>
    </section>
  );
}
