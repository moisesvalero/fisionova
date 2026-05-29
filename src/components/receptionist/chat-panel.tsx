"use client";

import { Check, Clock3, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import type {
  AppointmentSlot,
  ChatMessage,
  PatientDetails,
} from "@/lib/receptionist/types";
import { cn } from "@/lib/utils";

type ChatPanelProps = {
  messages: ChatMessage[];
  pending: boolean;
  proposedSlots: AppointmentSlot[];
  selectedSlot: AppointmentSlot | null;
  bookingPending: boolean;
  className?: string;
  inputId?: string;
  mode?: "inline" | "modal";
  onInputFocus?: () => void;
  onSubmit: (message: string) => void;
  onSelectSlot: (slot: AppointmentSlot) => void;
  onConfirmBooking: (details: PatientDetails) => void;
};

function formatShortDate(date: string) {
  const [, month, day] = date.split("-");

  return month && day ? `${day}/${month}` : date;
}

export function ChatPanel({
  messages,
  pending,
  proposedSlots,
  selectedSlot,
  bookingPending,
  className,
  inputId = "receptionist-message",
  mode = "inline",
  onInputFocus,
  onSubmit,
  onSelectSlot,
  onConfirmBooking,
}: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof bottomRef.current?.scrollIntoView !== "function") {
      return;
    }

    bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending, proposedSlots.length, selectedSlot, bookingPending]);

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

  function handleBookingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const patientName = String(formData.get("patientName") ?? "").trim();
    const patientEmail = String(formData.get("patientEmail") ?? "").trim();
    const patientPhone = String(formData.get("patientPhone") ?? "").trim();

    if (!patientName || !patientEmail || !patientPhone) {
      return;
    }

    onConfirmBooking({ patientName, patientEmail, patientPhone });
  }

  return (
    <section
      className={cn(
        "chat-panel-motion glass shadow-elegant border-border/60 flex w-full flex-col overflow-hidden rounded-xl border",
        mode === "modal"
          ? "modal-panel h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] max-w-4xl sm:h-auto sm:max-h-[calc(100svh-3rem)]"
          : "chat-panel-inline max-w-md",
        className,
      )}
    >
      <header className="chat-panel-header border-border/50 flex items-center gap-3 border-b px-4 py-3 sm:px-5 sm:py-4">
        <div className="relative">
          <div className="bg-sage flex h-8 w-8 items-center justify-center rounded-full sm:h-9 sm:w-9">
            <Sparkles
              className="text-sage-foreground h-4 w-4"
              strokeWidth={2}
              aria-hidden="true"
            />
          </div>
          <span className="animate-pulse-dot border-card bg-sage absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2" />
        </div>
        <div className="flex-1">
          <p className="text-foreground text-xs font-medium sm:text-sm">
            Recepción online
          </p>
          <p className="text-muted-foreground text-[11px] sm:text-xs">
            En línea, responde al instante
          </p>
        </div>
      </header>

      <div
        className={cn(
          "chat-panel-messages bg-background/40 space-y-3 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5",
          mode === "modal"
            ? "min-h-0 flex-1 md:max-h-[min(64vh,680px)] md:min-h-[420px] md:px-8 md:py-7"
            : "max-h-[184px] min-h-[132px] sm:max-h-[340px] sm:min-h-[220px]",
        )}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message-pop animate-fade-up flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[88%] px-3.5 py-2 text-xs leading-relaxed sm:max-w-[85%] sm:px-4 sm:py-2.5 sm:text-sm ${
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
                className="magic-button bg-sage text-sage-foreground hover:bg-sage/90 inline-flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors"
                onClick={() => onSelectSlot(slot)}
              >
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                Elegir {formatShortDate(slot.date)} · {slot.time}
              </button>
            ))}
          </div>
        ) : null}

        {selectedSlot ? (
          <form
            className="animate-fade-up border-border/60 bg-card grid gap-3 rounded-2xl rounded-bl-md border p-4"
            onSubmit={handleBookingSubmit}
          >
            <div>
              <p className="text-sm font-medium">Te tomo los datos</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {formatShortDate(selectedSlot.date)} · {selectedSlot.time}
              </p>
            </div>
            <label className="grid gap-1.5 text-xs font-medium">
              Nombre
              <input
                name="patientName"
                className="border-border bg-background focus:ring-ring/40 rounded-md border px-3 py-2 text-base font-normal outline-none focus:ring-2 sm:text-sm"
                placeholder="Tu nombre"
                disabled={bookingPending}
                required
              />
            </label>
            <label className="grid gap-1.5 text-xs font-medium">
              Email
              <input
                name="patientEmail"
                type="email"
                className="border-border bg-background focus:ring-ring/40 rounded-md border px-3 py-2 text-base font-normal outline-none focus:ring-2 sm:text-sm"
                placeholder="tu@email.com"
                disabled={bookingPending}
                required
              />
            </label>
            <label className="grid gap-1.5 text-xs font-medium">
              Teléfono
              <input
                name="patientPhone"
                type="tel"
                className="border-border bg-background focus:ring-ring/40 rounded-md border px-3 py-2 text-base font-normal outline-none focus:ring-2 sm:text-sm"
                placeholder="600 000 000"
                disabled={bookingPending}
                required
              />
            </label>
            <Button type="submit" size="sm" disabled={bookingPending}>
              {bookingPending ? "Un momentito..." : "Dejarlo apuntado"}
            </Button>
          </form>
        ) : null}

        {pending ? (
          <div className="animate-fade-up flex justify-start">
            <div className="border-border/60 bg-card text-muted-foreground inline-flex max-w-[85%] items-center gap-2 rounded-2xl rounded-bl-md border px-4 py-2.5 text-sm">
              <span className="animate-pulse-dot bg-sage h-2 w-2 rounded-full" />
              Un momentito, te leo...
            </div>
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <div className="chat-panel-footer border-border/50 bg-card/85 shrink-0 border-t px-3 py-3 sm:px-4 sm:py-3.5">
        <div className="chat-panel-meta text-muted-foreground mb-2.5 flex items-center justify-between gap-3 text-[10px] sm:mb-3 sm:text-[11px]">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            Agenda en tiempo real
          </span>
          <span>Confirmación por email</span>
        </div>
        <form
          className="chat-input-shell border-border/70 bg-background/80 focus-within:ring-ring/40 flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-shadow focus-within:ring-2"
          suppressHydrationWarning
          onSubmit={handleSubmit}
        >
          <label className="sr-only" htmlFor={inputId}>
            Mensaje para recepción
          </label>
          <input
            id={inputId}
            name="message"
            className="text-foreground placeholder:text-muted-foreground flex-1 bg-transparent px-2 py-1.5 text-base outline-none sm:py-2 sm:text-sm"
            placeholder="Escribe un mensaje..."
            disabled={pending}
            autoFocus={mode === "modal"}
            suppressHydrationWarning
            onClick={mode === "inline" ? onInputFocus : undefined}
            onFocus={mode === "inline" ? onInputFocus : undefined}
          />
          <Button
            type="submit"
            size="icon"
            className="magic-button bg-primary text-primary-foreground h-8 w-8 hover:opacity-90 sm:h-9 sm:w-9"
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
