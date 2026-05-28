"use client";

import { Check, Send, Sparkles } from "lucide-react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import type { AppointmentSlot, ChatMessage } from "@/lib/receptionist/types";

type ChatPanelProps = {
  messages: ChatMessage[];
  pending: boolean;
  quickPrompts: string[];
  proposedSlots: AppointmentSlot[];
  onPrompt: (message: string) => void;
  onSubmit: (message: string) => void;
  onSelectSlot: (slot: AppointmentSlot) => void;
};

export function ChatPanel({
  messages,
  pending,
  quickPrompts,
  proposedSlots,
  onPrompt,
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
            En linea, responde al instante
          </p>
        </div>
      </header>

      <div className="bg-background/40 max-h-[340px] space-y-3 overflow-y-auto px-5 py-5">
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
                Confirmar {slot.time}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="border-border/50 bg-card/80 border-t px-3 py-3">
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <Button
              key={prompt}
              type="button"
              size="sm"
              variant="secondary"
              className="bg-secondary/70 text-secondary-foreground hover:bg-secondary h-8 text-xs"
              onClick={() => onPrompt(prompt)}
            >
              {prompt}
            </Button>
          ))}
        </div>

        <form className="mt-3 flex items-center gap-2" onSubmit={handleSubmit}>
          <input
            name="message"
            className="text-foreground placeholder:text-muted-foreground flex-1 bg-transparent px-3 py-2 text-sm outline-none"
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
            <span className="sr-only">Enviar</span>
          </Button>
        </form>
      </div>
    </section>
  );
}
