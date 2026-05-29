"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ArrowRight,
  CalendarSearch,
  CheckCircle2,
  Clock3,
  Code2,
  Ear,
  Globe2,
  Mail,
  Menu,
  MessageCircle,
  MapPin,
  Phone,
  Sparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ChatPanel } from "@/components/receptionist/chat-panel";
import {
  clinicProfile,
  therapists,
  treatments,
} from "@/lib/receptionist/demo-data";
import type {
  Appointment,
  AppointmentSlot,
  ChatMessage,
  PatientDetails,
  ReceptionAction,
} from "@/lib/receptionist/types";

const assistantGreeting: ChatMessage = {
  id: "assistant-greeting",
  role: "assistant",
  content:
    "¡Hola! Soy Clara, la recepcionista de FisioNova. Cuéntame qué necesitas y te echo una mano con la cita, precios o cualquier duda.",
};

const therapistPhotos: Record<string, string> = {
  marta:
    "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=900&q=82",
  alvaro:
    "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=900&q=82",
};

const clinicPhotos = {
  assessment: "/images/clinic-hero.jpg",
  movement:
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=82",
  room: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=900&q=82",
};

const treatmentPhotos: Record<string, string> = {
  general:
    "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=900&q=82",
  sports:
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=82",
  postural:
    "https://images.unsplash.com/photo-1600881333168-2ef49b341f30?auto=format&fit=crop&w=900&q=82",
};

const navigationLinks = [
  { label: "Clínica", href: "#about" },
  { label: "Tratamientos", href: "#treatments" },
  { label: "Equipo", href: "#team" },
  { label: "Contacto", href: "#contact" },
];

export function ReceptionistExperience() {
  const pageRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([assistantGreeting]);
  const [proposedSlots, setProposedSlots] = useState<AppointmentSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(
    null,
  );
  const [pending, setPending] = useState(false);
  const [bookingPending, setBookingPending] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [chatViewport, setChatViewport] = useState({
    height: 0,
    offsetTop: 0,
    keyboardOpen: false,
  });
  const [completedBooking, setCompletedBooking] = useState(false);
  const [pendingAppointmentTriage, setPendingAppointmentTriage] =
    useState(false);
  const [pendingRequestedDate, setPendingRequestedDate] = useState<
    string | null
  >(null);

  useEffect(() => {
    const page = pageRef.current;

    if (!page) {
      return;
    }

    const prefersReducedMotion =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;

    const revealElements = Array.from(
      page.querySelectorAll<HTMLElement>(
        ".reveal-up, .reveal-up-delayed, .reveal-soft, .reveal-left, .reveal-right, .reveal-scale",
      ),
    );

    if (prefersReducedMotion?.matches) {
      revealElements.forEach((element) => element.classList.add("is-visible"));

      return;
    }

    if (typeof IntersectionObserver !== "function") {
      revealElements.forEach((element) => element.classList.add("is-visible"));

      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.18,
      },
    );

    revealElements.forEach((element) => observer.observe(element));

    const parallaxElements = Array.from(
      page.querySelectorAll<HTMLElement>("[data-parallax]"),
    );
    let frame = 0;

    const updateParallax = () => {
      frame = 0;
      const viewportHeight = window.innerHeight || 1;

      parallaxElements.forEach((element) => {
        const strength = Number(element.dataset.parallax ?? 24);
        const rect = element.getBoundingClientRect();
        const elementCenter = rect.top + rect.height / 2;
        const progress = (viewportHeight / 2 - elementCenter) / viewportHeight;
        const clampedProgress = Math.max(-1.2, Math.min(1.2, progress));

        element.style.setProperty(
          "--parallax-y",
          `${(clampedProgress * strength).toFixed(2)}px`,
        );
      });
    };

    const requestParallax = () => {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(updateParallax);
    };

    updateParallax();
    window.addEventListener("scroll", requestParallax, { passive: true });
    window.addEventListener("resize", requestParallax);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", requestParallax);
      window.removeEventListener("resize", requestParallax);

      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  useEffect(() => {
    if (!isChatModalOpen || typeof window === "undefined") {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function syncViewport() {
      const viewport = window.visualViewport;
      const height = viewport?.height ?? window.innerHeight;
      const offsetTop = viewport?.offsetTop ?? 0;

      setChatViewport({
        height,
        offsetTop,
        keyboardOpen: height < window.innerHeight * 0.78,
      });
    }

    syncViewport();
    window.visualViewport?.addEventListener("resize", syncViewport);
    window.visualViewport?.addEventListener("scroll", syncViewport);
    window.addEventListener("resize", syncViewport);

    return () => {
      window.visualViewport?.removeEventListener("resize", syncViewport);
      window.visualViewport?.removeEventListener("scroll", syncViewport);
      window.removeEventListener("resize", syncViewport);
      document.body.style.overflow = previousOverflow;
    };
  }, [isChatModalOpen]);

  function addAssistantMessage(content: string) {
    setMessages((current) => [
      ...current,
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content,
      },
    ]);
  }

  async function handleSubmit(message: string) {
    setPending(true);
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", content: message },
    ]);

    try {
      const response = await fetch("/api/receptionist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          context: {
            completedBooking,
            pendingAppointmentTriage,
            requestedDate: pendingRequestedDate,
          },
        }),
      });
      const payload = (await response.json()) as { action: ReceptionAction };

      addAssistantMessage(payload.action.message);
      setSelectedSlot(null);
      setProposedSlots(
        payload.action.type === "propose_slots" ? payload.action.slots : [],
      );
      setPendingAppointmentTriage(
        payload.action.type === "reply" &&
          payload.action.message.includes("Antes de mirar hora"),
      );
      if (
        payload.action.type === "reply" ||
        payload.action.type === "propose_slots"
      ) {
        setPendingRequestedDate(payload.action.requestedDate ?? null);
      }
      if (payload.action.type === "propose_slots") {
        setCompletedBooking(false);
        setPendingRequestedDate(null);
      }
    } catch {
      addAssistantMessage(
        "Uy, ahora mismo se me ha atascado la conexión. Prueba otra vez en un momento y te ayudo con la cita.",
      );
    } finally {
      setPending(false);
    }
  }

  function handleSelectSlot(slot: AppointmentSlot) {
    setPendingAppointmentTriage(false);
    setPendingRequestedDate(null);
    setCompletedBooking(false);
    setSelectedSlot(slot);
    setProposedSlots([]);
    addAssistantMessage(
      `Genial, te apunto ese hueco: ${slot.date} a las ${slot.time}. Pásame tu nombre, email y teléfono y lo dejamos preparado.`,
    );
  }

  async function handleConfirmBooking(details: PatientDetails) {
    if (!selectedSlot) {
      return;
    }

    setBookingPending(true);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot: selectedSlot,
          ...details,
        }),
      });
      const payload = (await response.json()) as { appointment: Appointment };

      setSelectedSlot(null);
      setProposedSlots([]);
      setPendingAppointmentTriage(false);
      setPendingRequestedDate(null);
      setCompletedBooking(true);
      addAssistantMessage(
        `Listo, ${details.patientName}. Te dejo apuntado para el ${payload.appointment.date} a las ${payload.appointment.time}. Recibirás la confirmación por email.`,
      );
    } catch {
      addAssistantMessage(
        "Ay, no he podido dejarlo apuntado ahora mismo. Prueba otra vez en unos segundos, porfa.",
      );
    } finally {
      setBookingPending(false);
    }
  }

  const chatModalStyle =
    chatViewport.height > 0
      ? ({
          "--chat-viewport-height": `${chatViewport.height}px`,
          "--chat-viewport-top": `${chatViewport.offsetTop}px`,
        } as CSSProperties)
      : undefined;

  return (
    <div ref={pageRef} className="bg-background text-foreground min-h-screen">
      <section className="relative min-h-[100svh] w-full overflow-hidden">
        <Image
          src="/images/clinic-hero.jpg"
          alt="Sala de tratamiento de fisioterapia moderna y luminosa"
          fill
          priority
          quality={90}
          sizes="100vw"
          className="hero-media parallax-layer object-cover"
          data-parallax="34"
        />
        <div className="hero-overlay from-charcoal/70 via-charcoal/40 to-charcoal/80 absolute inset-0 bg-gradient-to-b" />
        <div className="hero-overlay from-charcoal/60 absolute inset-0 bg-gradient-to-r via-transparent to-transparent" />

        <nav className="hero-nav border-cream/10 bg-charcoal/65 fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b px-4 py-3 backdrop-blur-sm sm:px-6 sm:py-4 lg:px-12">
          <a href="#" className="text-cream flex items-center gap-2">
            <div className="bg-sage flex h-7 w-7 items-center justify-center rounded-md">
              <Sparkles
                className="text-sage-foreground h-3.5 w-3.5"
                strokeWidth={2.5}
                aria-hidden="true"
              />
            </div>
            <span className="font-display text-base tracking-tight sm:text-lg">
              FisioNova <span className="opacity-60">Clínica</span>
            </span>
          </a>
          <div className="text-cream/90 hidden items-center gap-6 text-sm md:flex">
            {navigationLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="hover:text-cream transition-colors"
              >
                {item.label}
              </a>
            ))}
            <Link href="/medico" className="hover:text-cream transition-colors">
              Área clínica
            </Link>
            <a
              href="#chat"
              className="bg-cream text-charcoal hover:bg-sage hover:text-sage-foreground rounded-md px-3.5 py-2 text-xs font-medium transition-colors"
            >
              Reservar
            </a>
          </div>
          <button
            type="button"
            className="border-cream/15 bg-cream/10 text-cream hover:bg-cream/15 inline-flex h-10 w-10 items-center justify-center rounded-md border transition-colors md:hidden"
            aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((current) => !current)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
          {isMobileMenuOpen ? (
            <div className="border-cream/12 bg-charcoal/95 shadow-elegant text-cream absolute top-full right-3 left-3 mt-2 overflow-hidden rounded-xl border p-2 text-sm md:hidden">
              {navigationLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="hover:bg-cream/10 block rounded-lg px-4 py-3 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <Link
                href="/medico"
                className="hover:bg-cream/10 block rounded-lg px-4 py-3 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Área clínica
              </Link>
              <button
                type="button"
                className="bg-cream text-charcoal mt-2 flex w-full items-center justify-between rounded-lg px-4 py-3 text-left font-medium"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsChatModalOpen(true);
                }}
              >
                Reservar cita
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </nav>

        <div className="relative z-10 mx-auto grid min-h-[100svh] max-w-7xl items-center gap-5 px-4 pt-24 pb-6 sm:gap-10 sm:px-6 sm:pt-32 sm:pb-20 lg:grid-cols-12 lg:gap-8 lg:px-12 lg:pt-40 lg:pb-28">
          <div className="hero-copy text-cream lg:col-span-6">
            <div className="hero-kicker text-cream/70 mb-3 inline-flex items-center gap-2 text-[10px] tracking-[0.18em] uppercase sm:mb-6 sm:text-xs">
              <span className="animate-pulse-dot bg-sage h-1.5 w-1.5 rounded-full" />
              Fisioterapia en Madrid · cita online
            </div>
            <h1 className="hero-title font-display text-cream text-[2.42rem] leading-[0.98] sm:text-5xl lg:text-6xl">
              Fisioterapia para
              <br />
              <span className="text-accent italic drop-shadow-[0_2px_14px_rgba(0,0,0,0.65)]">
                moverte sin dolor
              </span>
            </h1>
            <p className="hero-text text-cream/80 mt-4 max-w-xl text-sm leading-relaxed sm:mt-6 sm:text-lg">
              Tratamientos personalizados para dolor de espalda, lesiones
              deportivas y recuperación funcional. Reserva tu cita hablando con
              recepción, sin llamadas ni formularios largos.
            </p>
            <div className="hero-actions mt-5 flex flex-wrap gap-2.5 sm:mt-8 sm:gap-3">
              <a
                href="#chat"
                className="magic-button bg-cream text-charcoal hover:bg-cream/90 inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-xs font-medium transition-colors sm:px-5 sm:py-3 sm:text-sm"
              >
                Reservar cita <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#treatments"
                className="magic-button border-cream/30 text-cream hover:bg-cream/10 inline-flex items-center gap-2 rounded-md border px-4 py-2.5 text-xs font-medium transition-colors sm:px-5 sm:py-3 sm:text-sm"
              >
                Ver tratamientos
              </a>
            </div>
          </div>

          <div
            id="chat"
            className="hero-chat flex flex-col items-center gap-4 pb-2 lg:col-span-6 lg:items-end lg:pb-0"
          >
            <button
              type="button"
              className="mobile-chat-launcher glass shadow-elegant border-border/60 w-full rounded-xl border p-3 text-left sm:hidden"
              onClick={() => setIsChatModalOpen(true)}
            >
              <span className="flex items-center gap-3">
                <span className="bg-sage text-sage-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-foreground block text-sm font-semibold">
                    Habla con Clara
                  </span>
                  <span className="text-muted-foreground mt-0.5 block text-xs">
                    Pide cita en un momento, como por WhatsApp.
                  </span>
                </span>
                <span className="bg-primary text-primary-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </span>
              <span className="border-border/60 bg-background/85 text-muted-foreground mt-3 block rounded-lg border px-3 py-2 text-xs">
                Escribe lo que necesitas y te enseño huecos.
              </span>
            </button>
            <ChatPanel
              className="hidden sm:block"
              inputId="receptionist-message-inline"
              messages={messages}
              pending={pending}
              proposedSlots={proposedSlots}
              selectedSlot={selectedSlot}
              bookingPending={bookingPending}
              onInputFocus={() => setIsChatModalOpen(true)}
              onSubmit={handleSubmit}
              onSelectSlot={handleSelectSlot}
              onConfirmBooking={handleConfirmBooking}
            />
          </div>
        </div>
      </section>

      {isChatModalOpen ? (
        <div
          className="modal-backdrop bg-charcoal/70 fixed inset-x-0 top-0 z-50 flex h-[var(--chat-viewport-height,100dvh)] translate-y-[var(--chat-viewport-top,0px)] items-end justify-center px-2 py-2 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6"
          style={chatModalStyle}
          role="dialog"
          aria-modal="true"
          aria-label="Chat de recepción"
        >
          <ChatPanel
            mode="modal"
            className={chatViewport.keyboardOpen ? "chat-panel-keyboard" : ""}
            inputId="receptionist-message-modal"
            messages={messages}
            pending={pending}
            proposedSlots={proposedSlots}
            selectedSlot={selectedSlot}
            bookingPending={bookingPending}
            onClose={() => setIsChatModalOpen(false)}
            onSubmit={handleSubmit}
            onSelectSlot={handleSelectSlot}
            onConfirmBooking={handleConfirmBooking}
          />
        </div>
      ) : null}

      <AboutSectionBalanced />
      <ClinicGallerySection />
      <HowItWorks />
      <TreatmentsSection />
      <TeamSection />
      <BookingSection />
      <FirstVisitSection />
      <ContactSection />
      <FAQSection />
      <FinalCTA />
      <Footer />
    </div>
  );
}

function AboutSection() {
  return (
    <section id="about" className="px-6 py-24 lg:px-12 lg:py-32">
      <div className="reveal-up mx-auto grid max-w-7xl items-start gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <span className="text-sage text-xs tracking-[0.18em] uppercase">
            Quiénes somos
          </span>
          <h2 className="font-display mt-3 text-3xl leading-tight lg:text-5xl">
            Una clínica tranquila para recuperarte con confianza
          </h2>
          <div className="reveal-up-delayed relative mt-10 hidden min-h-[420px] lg:block">
            <div className="shadow-elegant relative h-[340px] overflow-hidden rounded-xl">
              <Image
                src={clinicPhotos.assessment}
                alt="Fisioterapeuta valorando la movilidad de una paciente"
                fill
                sizes="420px"
                className="object-cover"
              />
            </div>
            <div className="border-background bg-background shadow-elegant absolute right-0 bottom-0 h-44 w-56 overflow-hidden rounded-xl border-8">
              <Image
                src={clinicPhotos.room}
                alt="Cabina luminosa de fisioterapia"
                fill
                sizes="224px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
        <div className="text-muted-foreground space-y-6 text-lg leading-relaxed lg:col-span-7">
          <p>
            En FisioNova trabajamos con sesiones individuales, evaluación clara
            y planes de tratamiento que puedas entender. Nuestro objetivo es que
            salgas sabiendo qué te pasa, qué vamos a trabajar y cómo puedes
            cuidarte entre sesiones.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["+6 años", "acompañando recuperaciones"],
              ["1 a 1", "sin tratamientos en cadena"],
              ["Madrid", "Calle Salud 18"],
            ].map(([value, label]) => (
              <div
                key={value}
                className="reveal-soft border-border bg-card rounded-xl border p-5"
              >
                <p className="font-display text-foreground text-2xl">{value}</p>
                <p className="text-muted-foreground mt-1 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

void AboutSection;

function AboutSectionBalanced() {
  const trustItems = [
    ["+6 años", "acompañando recuperaciones"],
    ["1 a 1", "sin tratamientos en cadena"],
    ["Madrid", "Calle Salud 18"],
  ];

  return (
    <section
      id="about"
      className="premium-section px-6 py-20 lg:px-12 lg:py-28"
    >
      <div className="reveal-split mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-12">
        <div className="reveal-left relative lg:col-span-6">
          <div
            className="image-reveal parallax-layer shadow-elegant relative aspect-[5/4] overflow-hidden rounded-xl lg:aspect-[4/3]"
            data-parallax="22"
          >
            <Image
              src={clinicPhotos.assessment}
              alt="Sala luminosa de fisioterapia preparada para una sesión"
              fill
              sizes="(min-width: 1024px) 48vw, 100vw"
              className="object-cover"
            />
            <div className="from-charcoal/45 absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />
          </div>
          <div
            className="float-card parallax-layer border-background bg-card shadow-elegant absolute right-4 bottom-4 max-w-[260px] rounded-xl border p-4 lg:right-6 lg:bottom-6"
            data-parallax="-16"
          >
            <p className="text-sage text-[11px] font-medium tracking-[0.16em] uppercase">
              Primera valoración
            </p>
            <p className="text-foreground mt-2 text-sm leading-relaxed">
              Revisamos dolor, movilidad y objetivos antes de empezar el
              tratamiento.
            </p>
          </div>
        </div>

        <div className="reveal-right lg:col-span-6">
          <span className="text-sage text-xs tracking-[0.18em] uppercase">
            Quiénes somos
          </span>
          <h2 className="font-display mt-3 text-3xl leading-tight lg:text-5xl">
            Una clínica tranquila para recuperarte con confianza
          </h2>
          <div className="text-muted-foreground mt-6 grid gap-5 text-base leading-relaxed lg:grid-cols-2">
            <p>
              En FisioNova trabajamos con sesiones individuales, evaluación
              clara y planes de tratamiento que puedas entender desde el primer
              día.
            </p>
            <p>
              Nuestro objetivo es que salgas sabiendo qué te pasa, qué vamos a
              trabajar y cómo puedes cuidarte entre sesiones.
            </p>
          </div>
          <div className="stagger-list mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-2">
            {trustItems.map(([value, label], index) => (
              <div
                key={value}
                className={`reveal-soft motion-card border-border bg-card rounded-xl border p-5 ${
                  index === 2 ? "lg:col-span-2" : ""
                }`}
              >
                <p className="font-display text-foreground text-2xl">{value}</p>
                <p className="text-muted-foreground mt-1 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ClinicGallerySection() {
  return (
    <section className="premium-section section-dark bg-charcoal text-cream overflow-hidden px-6 py-20 lg:px-12 lg:py-28">
      <div className="reveal-split mx-auto grid max-w-7xl items-end gap-8 lg:grid-cols-12">
        <div className="reveal-left lg:col-span-4">
          <span className="text-sage text-xs tracking-[0.18em] uppercase">
            Espacio
          </span>
          <h2 className="font-display mt-3 text-3xl leading-tight lg:text-5xl">
            Luz, calma y movimiento guiado
          </h2>
          <p className="text-cream/70 mt-5 text-sm leading-relaxed">
            Un entorno pensado para valorar, tratar y entrenar sin prisas.
          </p>
        </div>
        <div className="stagger-list reveal-right grid gap-4 lg:col-span-8 lg:grid-cols-5">
          <div
            className="image-reveal parallax-layer premium-photo relative min-h-[360px] overflow-hidden rounded-xl lg:col-span-3"
            data-parallax="26"
          >
            <Image
              src={clinicPhotos.movement}
              alt="Sesión de movimiento terapéutico en una clínica luminosa"
              fill
              sizes="(min-width: 1024px) 52vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="grid gap-4 lg:col-span-2">
            {[clinicPhotos.room, clinicPhotos.assessment].map(
              (photo, index) => (
                <div
                  key={photo}
                  className="image-reveal parallax-layer premium-photo relative min-h-[170px] overflow-hidden rounded-xl"
                  data-parallax={index === 0 ? "-18" : "14"}
                >
                  <Image
                    src={photo}
                    alt={
                      index === 0
                        ? "Sala privada preparada para fisioterapia"
                        : "Valoración personalizada de fisioterapia"
                    }
                    fill
                    sizes="(min-width: 1024px) 22vw, 100vw"
                    className="object-cover"
                  />
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: Ear,
      title: "Cuéntanos",
      text: "Escribe qué necesitas: dolor, lesión, horario o tipo de tratamiento.",
    },
    {
      icon: CalendarSearch,
      title: "Vemos huecos",
      text: "Recepción consulta disponibilidad y te propone horas libres.",
    },
    {
      icon: CheckCircle2,
      title: "Reservamos",
      text: "Cuando eliges una hora, la cita queda bloqueada para ti.",
    },
    {
      icon: Mail,
      title: "Te avisamos",
      text: "Recibes la confirmación por email con los datos de la visita.",
    },
  ];

  return (
    <section
      id="how"
      className="premium-section bg-secondary/40 px-6 py-24 lg:px-12 lg:py-32"
    >
      <div className="reveal-up mx-auto max-w-7xl">
        <header className="mb-16 max-w-2xl">
          <span className="text-sage text-xs tracking-[0.18em] uppercase">
            Citas
          </span>
          <h2 className="font-display mt-3 text-3xl leading-tight lg:text-5xl">
            Reserva sin esperar al teléfono
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Una conversación breve para encontrar el mejor momento y dejar tu
            cita cerrada.
          </p>
        </header>

        <ol className="stagger-list border-border bg-border grid overflow-hidden rounded-xl border md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="reveal-soft motion-card group bg-background hover:bg-secondary/40 relative flex flex-col gap-4 p-8 transition-colors lg:p-10"
            >
              <div className="flex items-center justify-between">
                <div className="bg-sage/15 flex h-11 w-11 items-center justify-center rounded-md">
                  <step.icon
                    className="text-sage h-5 w-5"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </div>
                <span className="font-display text-muted-foreground/40 text-3xl tabular-nums">
                  0{index + 1}
                </span>
              </div>
              <div>
                <h3 className="mb-2 text-xl">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function TreatmentsSection() {
  return (
    <section
      id="treatments"
      className="premium-section px-6 py-24 lg:px-12 lg:py-32"
    >
      <div className="reveal-up mx-auto max-w-7xl">
        <header className="mb-16 max-w-2xl">
          <span className="text-sage text-xs tracking-[0.18em] uppercase">
            Tratamientos
          </span>
          <h2 className="font-display mt-3 text-3xl leading-tight lg:text-5xl">
            Fisioterapia cercana y personalizada
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Sesiones individuales con profesionales especializados en
            recuperación, dolor y movimiento.
          </p>
        </header>
        <div className="stagger-list grid gap-6 md:grid-cols-3">
          {treatments.map((treatment) => (
            <article
              key={treatment.id}
              className="reveal-soft premium-card motion-card border-border bg-card hover:border-sage/40 group overflow-hidden rounded-xl border transition-colors"
            >
              <div
                className="image-reveal parallax-layer relative aspect-[5/4] overflow-hidden"
                data-parallax="12"
              >
                <Image
                  src={treatmentPhotos[treatment.id]}
                  alt={`Tratamiento de ${treatment.name.toLowerCase()}`}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="from-charcoal/45 absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />
              </div>
              <div className="p-7">
                <span className="text-clay text-[11px] font-medium tracking-widest uppercase">
                  {treatment.durationMinutes} min · {treatment.price} €
                </span>
                <h3 className="font-display mt-4 mb-3 text-2xl">
                  {treatment.name}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {treatment.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function TeamSection() {
  return (
    <section
      id="team"
      className="premium-section section-dark bg-charcoal text-cream px-6 py-24 lg:px-12 lg:py-32"
    >
      <div className="reveal-split mx-auto grid max-w-7xl gap-12 lg:grid-cols-12">
        <div className="reveal-left lg:col-span-4">
          <span className="text-sage text-xs tracking-[0.18em] uppercase">
            Equipo
          </span>
          <h2 className="font-display mt-3 text-3xl leading-tight lg:text-5xl">
            Fisios que escuchan antes de tratar
          </h2>
        </div>
        <div className="stagger-list reveal-right grid gap-5 md:grid-cols-2 lg:col-span-8">
          {therapists.map((therapist) => (
            <article
              key={therapist.id}
              className="reveal-soft motion-card group border-cream/15 bg-cream/5 overflow-hidden rounded-xl border"
            >
              <div
                className="image-reveal parallax-layer relative aspect-[4/3] overflow-hidden"
                data-parallax="14"
              >
                <Image
                  src={therapistPhotos[therapist.id]}
                  alt={`${therapist.name}, fisioterapeuta de FisioNova`}
                  fill
                  sizes="(min-width: 1024px) 320px, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="from-charcoal/70 absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />
              </div>
              <div className="p-7">
                <p className="font-display text-2xl">{therapist.name}</p>
                <p className="text-sage mt-2 text-sm font-medium">
                  {therapist.specialty}
                </p>
                <p className="text-cream/70 mt-4 text-sm leading-relaxed">
                  Tratamiento individual, explicación clara y seguimiento de tu
                  evolución sesión a sesión.
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function BookingSection() {
  return (
    <section className="premium-section px-6 py-24 lg:px-12 lg:py-32">
      <div className="reveal-split mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-12">
        <div className="reveal-left lg:col-span-6">
          <span className="text-sage text-xs tracking-[0.18em] uppercase">
            Recepción online
          </span>
          <h2 className="font-display mt-3 text-3xl leading-tight lg:text-5xl">
            Pide cita igual que escribirías a la clínica
          </h2>
          <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
            Puedes pedir hora por la mañana, por la tarde, preguntar precios o
            cambiar una cita. Recepción revisa disponibilidad sin enseñar la
            agenda interna.
          </p>
        </div>
        <div
          className="reveal-right parallax-layer glass shadow-elegant border-border/60 glow-panel rounded-xl border p-6 lg:col-span-6"
          data-parallax="-18"
        >
          <ul className="stagger-list space-y-4 text-sm">
            {[
              "Disponibilidad real de profesionales",
              "Datos de pacientes visibles solo en el área clínica",
              "Confirmaciones y cambios enviados por email",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <CheckCircle2
                  className="text-sage h-4 w-4 shrink-0"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function FirstVisitSection() {
  return (
    <section className="premium-section bg-secondary/40 px-6 py-24 lg:px-12 lg:py-32">
      <div className="reveal-split mx-auto grid max-w-7xl gap-12 lg:grid-cols-12">
        <div className="reveal-left lg:col-span-5">
          <span className="text-sage text-xs tracking-[0.18em] uppercase">
            Primera visita
          </span>
          <h2 className="font-display mt-3 text-3xl leading-tight lg:text-5xl">
            Llegas, valoramos y sales con un plan claro
          </h2>
        </div>
        <div className="stagger-list reveal-right grid gap-4 md:grid-cols-3 lg:col-span-7">
          {[
            [
              "Valoración",
              "Revisamos tu dolor, movilidad, historial y objetivos.",
            ],
            [
              "Tratamiento",
              "Empezamos con terapia manual, ejercicio o educación según tu caso.",
            ],
            [
              "Plan en casa",
              "Te llevas pautas sencillas para avanzar entre sesiones.",
            ],
          ].map(([title, text], index) => (
            <article
              key={title}
              className="reveal-soft motion-card border-border bg-card rounded-xl border p-6"
            >
              <span className="font-display text-sage text-3xl">
                0{index + 1}
              </span>
              <h3 className="mt-5 text-lg font-medium">{title}</h3>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                {text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  const contactItems = [
    { icon: MapPin, label: "Dirección", value: clinicProfile.address },
    { icon: Phone, label: "Teléfono", value: clinicProfile.phone },
    { icon: Mail, label: "Email", value: clinicProfile.email },
    { icon: Clock3, label: "Horario", value: clinicProfile.openingHours },
  ];

  return (
    <section
      id="contact"
      className="premium-section bg-secondary/40 px-6 py-24 lg:px-12 lg:py-32"
    >
      <div className="reveal-split mx-auto grid max-w-7xl gap-12 lg:grid-cols-12">
        <div className="reveal-left lg:col-span-5">
          <span className="text-sage text-xs tracking-[0.18em] uppercase">
            Contacto
          </span>
          <h2 className="font-display mt-3 text-3xl leading-tight lg:text-5xl">
            Estamos en el centro de Madrid
          </h2>
          <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
            Ven con ropa cómoda y, si tienes pruebas médicas recientes, tráelas.
            Si no sabes qué tratamiento pedir, recepción te orienta.
          </p>
        </div>
        <div className="stagger-list reveal-right grid gap-4 md:grid-cols-2 lg:col-span-7">
          {contactItems.map((item) => (
            <div
              key={item.label}
              className="reveal-soft motion-card border-border bg-card rounded-xl border p-6"
            >
              <item.icon className="text-sage h-5 w-5" aria-hidden="true" />
              <p className="text-muted-foreground mt-4 text-xs tracking-[0.16em] uppercase">
                {item.label}
              </p>
              <p className="mt-2 text-sm font-medium">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const faqs = [
    {
      question: "¿Necesito diagnóstico médico para venir?",
      answer:
        "No siempre. Si tienes pruebas o informes, tráelos; si no, empezamos con una valoración fisioterapéutica.",
    },
    {
      question: "¿Puedo cambiar o cancelar una cita?",
      answer:
        "Sí. Desde recepción online puedes pedir cambios y el equipo lo gestiona desde el área clínica.",
    },
    {
      question: "¿Cuánto dura una sesión?",
      answer:
        "La mayoría de sesiones duran 50 minutos. Reeducación postural dura 60 minutos.",
    },
  ];

  return (
    <section className="premium-section px-6 py-24 lg:px-12 lg:py-32">
      <div className="reveal-up mx-auto max-w-4xl">
        <span className="text-sage text-xs tracking-[0.18em] uppercase">
          Dudas frecuentes
        </span>
        <h2 className="font-display mt-3 text-3xl leading-tight lg:text-5xl">
          Antes de venir
        </h2>
        <div className="stagger-list border-border bg-card mt-10 divide-y rounded-xl border">
          {faqs.map((faq) => (
            <article key={faq.question} className="reveal-soft motion-row p-6">
              <h3 className="text-base font-medium">{faq.question}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {faq.answer}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section
      id="cta"
      className="premium-section section-dark bg-charcoal text-cream relative overflow-hidden px-6 py-28 lg:px-12 lg:py-40"
    >
      <div
        className="cta-orbit parallax-layer"
        data-parallax="20"
        aria-hidden="true"
      />
      <div className="reveal-scale relative mx-auto max-w-3xl text-center">
        <h2 className="font-display text-cream text-4xl leading-tight lg:text-6xl">
          Reserva tu cita en <span className="text-sage italic">FisioNova</span>
        </h2>
        <p className="text-cream/70 mt-6 text-lg">
          Nuestro equipo te ayuda a encontrar el tratamiento y la hora que mejor
          encajan contigo.
        </p>
        <a
          href="#chat"
          className="magic-button bg-cream text-charcoal hover:bg-sage hover:text-sage-foreground mt-10 inline-flex items-center gap-2 rounded-md px-6 py-3.5 text-sm font-medium transition-colors"
        >
          Reservar cita <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}

function Footer() {
  function openCookieSettings() {
    window.dispatchEvent(new Event("fisionova-open-cookie-settings"));
  }

  return (
    <footer className="bg-charcoal border-cream/10 text-cream/60 border-t px-6 py-8 lg:px-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 text-sm md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p>FisioNova Clínica · Demo portfolio</p>
          <div className="text-cream/45 flex flex-wrap items-center gap-3 text-xs">
            <a
              href="https://github.com/moisesvalero"
              target="_blank"
              rel="noreferrer"
              className="hover:text-cream inline-flex items-center gap-1.5 transition-colors"
              aria-label="GitHub de Moisés Valero"
            >
              <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
              GitHub
            </a>
            <a
              href="https://moisesvalero.es/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-cream inline-flex items-center gap-1.5 transition-colors"
              aria-label="Portfolio de Moisés Valero"
            >
              <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />
              Portfolio
            </a>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <a href="#treatments" className="hover:text-cream transition-colors">
            Tratamientos
          </a>
          <a href="#contact" className="hover:text-cream transition-colors">
            Contacto
          </a>
          <Link
            href="/politica-cookies"
            className="hover:text-cream transition-colors"
          >
            Cookies
          </Link>
          <button
            type="button"
            className="hover:text-cream transition-colors"
            onClick={openCookieSettings}
          >
            Configurar cookies
          </button>
          <Link href="/medico" className="hover:text-cream transition-colors">
            Área clínica
          </Link>
        </div>
      </div>
    </footer>
  );
}
