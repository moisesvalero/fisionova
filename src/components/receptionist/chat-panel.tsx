"use client";

import { Check, Clock3, Send, Sparkles } from "lucide-react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import type { AppointmentSlot, ChatMessage } from "@/lib/receptionist/types";

type ChatPanelProps = {
  messages: ChatMessage[];
  pending: boolean;
  proposedSlots: AppointmentSlot[];
  onSubmit: (message: string) => void;
  onSelectSlot: (slot: AppointmentSlot) => void;
};

function formatShortDate(date: string) {
  const [, month, day] = date.split("-");

  return month && day ? `${day}/${month}` : date;
}

export function ChatPanel({
  messages,
  pending,
  proposedSlots,
  onSubmit,
  onSelectSlot,
}: ChatPanelProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const message = String(formData.get("message") ?? "").trim();

    if (!message) {
      return;
    }

    event.currentTarget.reset();
    onSubmit(message);
  }

  return (
    <section className="glass shadow-elegant border-border/60 w-full max-w-md overflow-hidden rounded-xl border">
      <header className="border-border/50 flex items-center gap-3 border-b px-5 py-4">
        <div className="relative">
          <div className="bg-sage flex h-9 w-9 items-center justify-center rounded-full">
            <Sparkles
              className="text-sage-foreground h-4 w-4"
              strokeWidth={2}
              aria-hidden="true"
            />
          </div>
          <span className="animate-pulse-dot border-card bg-sage absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2" />
        </div>
        <div className="flex-1">
          <p className="text-foreground text-sm font-medium">
            Recepcionista IA
          </p>
          <p className="text-muted-foreground text-xs">
            En línea, responde al instante
          </p>
        </div>
      </header>

      <div className="bg-background/40 max-h-[340px] min-h-[220px] space-y-3 overflow-y-auto px-5 py-5">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`animate-fade-up flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed ${
                message.role === "user"
                  ? "bg-charcoal text-cream rounded-2xl rounded-br-md"
                  : "border-border/60 bg-card text-foreground rounded-2xl rounded-bl-md border"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {proposedSlots.length > 0 ? (
          <div className="animate-fade-up border-border/60 bg-card grid gap-2 rounded-2xl rounded-bl-md border p-3">
            {proposedSlots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                className="bg-sage text-sage-foreground hover:bg-sage/90 inline-flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors"
                onClick={() => onSelectSlot(slot)}
              >
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                Confirmar {formatShortDate(slot.date)} · {slot.time}
              </button>
            ))}
          </div>
        ) : null}

        {pending ? (
          <div className="animate-fade-up flex justify-start">
            <div className="border-border/60 bg-card text-muted-foreground inline-flex max-w-[85%] items-center gap-2 rounded-2xl rounded-bl-md border px-4 py-2.5 text-sm">
              <span className="animate-pulse-dot bg-sage h-2 w-2 rounded-full" />
              Buscando huecos disponibles...
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-border/50 bg-card/85 border-t px-4 py-3.5">
        <div className="text-muted-foreground mb-3 flex items-center justify-between gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            Agenda en tiempo real
          </span>
          <span>Confirmación por email</span>
        </div>
        <form
          className="border-border/70 bg-background/80 focus-within:ring-ring/40 flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-shadow focus-within:ring-2"
          onSubmit={handleSubmit}
        >
          <label className="sr-only" htmlFor="receptionist-message">
            Mensaje para la recepcionista IA
          </label>
          <input
            id="receptionist-message"
            name="message"
            className="text-foreground placeholder:text-muted-foreground flex-1 bg-transparent px-2 py-2 text-sm outline-none"
            placeholder="Escribe un mensaje..."
            disabled={pending}
          />
          <Button
            type="submit"
            size="icon"
            className="bg-primary text-primary-foreground h-9 w-9 hover:opacity-90"
            disabled={pending}
          >
            <Send className="size-4" aria-hidden="true" />
            <span className="sr-only">
              {pending ? "Enviando mensaje" : "Enviar mensaje"}
            </span>
          </Button>
        </form>
      </div>
    </section>
  );
}
