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
    <section className="flex min-h-[660px] flex-col overflow-hidden rounded-lg border border-zinc-900 bg-zinc-950 shadow-[0_24px_80px_rgba(24,35,38,0.18)]">
      <header className="flex items-center justify-between border-b border-white/10 bg-zinc-950 p-5 text-zinc-50">
        <div>
          <p className="text-sm font-semibold">Recepcionista IA</p>
          <p className="text-xs text-zinc-400">
            Atencion calida, agenda conectada
          </p>
        </div>
        <div className="rounded-md bg-emerald-200 p-2 text-emerald-950">
          <Bot className="size-5" aria-hidden="true" />
        </div>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto bg-[radial-gradient(circle_at_18%_8%,rgba(110,231,183,0.16),transparent_26%),linear-gradient(180deg,rgba(39,39,42,0.96),rgba(24,24,27,1))] p-5">
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
              className={`max-w-[82%] rounded-lg px-4 py-3 text-sm leading-6 shadow-sm ${
                message.role === "user"
                  ? "bg-emerald-200 text-emerald-950"
                  : "bg-zinc-50 text-zinc-900"
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
          <div className="grid gap-2 rounded-lg border border-white/10 bg-white/8 p-3">
            {proposedSlots.map((slot) => (
              <Button
                key={slot.id}
                type="button"
                variant="outline"
                className="justify-start border-white/20 bg-zinc-50 text-zinc-950 hover:bg-emerald-100"
                onClick={() => onSelectSlot(slot)}
              >
                <CalendarCheck className="size-4" aria-hidden="true" />
                {slot.date} a las {slot.time}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-3 border-t border-white/10 bg-zinc-950 p-5">
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <Button
              key={prompt}
              type="button"
              size="sm"
              variant="secondary"
              className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
              onClick={() => onPrompt(prompt)}
            >
              {prompt}
            </Button>
          ))}
        </div>

        <form className="flex gap-2" onSubmit={handleSubmit}>
          <input
            name="message"
            className="min-h-11 flex-1 rounded-md border border-white/10 bg-white px-3 text-sm text-zinc-950 outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
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
