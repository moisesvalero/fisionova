"use client";

import { Bot, CalendarCheck, Send, UserRound } from "lucide-react";
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
    <section className="border-border bg-card flex min-h-[620px] flex-col rounded-lg border shadow-sm">
      <header className="border-border flex items-center justify-between border-b p-4">
        <div>
          <p className="text-sm font-semibold">Recepcionista IA</p>
          <p className="text-xs text-zinc-500">Atencion calida en tiempo real</p>
        </div>
        <Bot className="text-primary size-5" aria-hidden="true" />
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" ? (
              <Bot className="text-primary mt-1 size-5 shrink-0" />
            ) : null}
            <div
              className={`max-w-[82%] rounded-lg px-4 py-3 text-sm leading-6 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {message.content}
            </div>
            {message.role === "user" ? (
              <UserRound className="text-primary mt-1 size-5 shrink-0" />
            ) : null}
          </div>
        ))}

        {proposedSlots.length > 0 ? (
          <div className="grid gap-2">
            {proposedSlots.map((slot) => (
              <Button
                key={slot.id}
                type="button"
                variant="outline"
                className="justify-start"
                onClick={() => onSelectSlot(slot)}
              >
                <CalendarCheck className="size-4" aria-hidden="true" />
                {slot.date} a las {slot.time}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="border-border space-y-3 border-t p-4">
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <Button
              key={prompt}
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => onPrompt(prompt)}
            >
              {prompt}
            </Button>
          ))}
        </div>

        <form className="flex gap-2" onSubmit={handleSubmit}>
          <input
            name="message"
            className="border-input bg-background focus-visible:ring-ring min-h-10 flex-1 rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
            placeholder="Escribe: quiero cita el viernes por la tarde..."
            disabled={pending}
          />
          <Button type="submit" size="icon" disabled={pending}>
            <Send className="size-4" aria-hidden="true" />
            <span className="sr-only">Enviar</span>
          </Button>
        </form>
      </div>
    </section>
  );
}
