import { MailCheck } from "lucide-react";

import type { EmailLogItem } from "@/lib/receptionist/types";

type EmailLogProps = {
  emails: EmailLogItem[];
};

export function EmailLog({ emails }: EmailLogProps) {
  return (
    <section className="glass shadow-elegant border-border/60 overflow-hidden rounded-xl border">
      <header className="border-border/50 flex items-center gap-3 border-b px-5 py-4">
        <MailCheck className="text-sage size-5" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold">Emails de cita</p>
          <p className="text-xs text-zinc-500">Confirmaciones y cambios</p>
        </div>
      </header>

      <div className="space-y-3 px-5 py-5">
        {emails.length === 0 ? (
          <p className="text-sm leading-6 text-zinc-500">
            Los emails apareceran aqui al confirmar, modificar o cancelar citas.
          </p>
        ) : (
          emails.map((email) => (
            <article key={email.id} className="bg-muted rounded-lg p-4">
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
      </div>
    </section>
  );
}
