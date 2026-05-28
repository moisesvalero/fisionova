import { MailCheck } from "lucide-react";

import type { EmailLogItem } from "@/lib/receptionist/types";

type EmailLogProps = {
  emails: EmailLogItem[];
};

export function EmailLog({ emails }: EmailLogProps) {
  return (
    <section className="border-border bg-card rounded-lg border shadow-sm">
      <header className="border-border flex items-center gap-3 border-b p-4">
        <MailCheck className="text-primary size-5" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold">Emails de cita</p>
          <p className="text-xs text-zinc-500">Confirmaciones y cambios</p>
        </div>
      </header>

      <div className="space-y-3 p-4">
        {emails.length === 0 ? (
          <p className="text-sm leading-6 text-zinc-500">
            Los emails apareceran aqui al confirmar, modificar o cancelar citas.
          </p>
        ) : (
          emails.map((email) => (
            <article key={email.id} className="bg-muted rounded-lg p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium">{email.subject}</p>
                <span className="text-primary text-xs font-semibold uppercase">
                  {email.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">{email.recipient}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
