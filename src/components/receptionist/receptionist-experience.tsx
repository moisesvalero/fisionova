"use client";

import { useState } from "react";
import {
  ArrowRight,
  CalendarSearch,
  CheckCircle2,
  Clock3,
  Ear,
  Mail,
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
  EmailEventType,
  PatientDetails,
  ReceptionAction,
} from "@/lib/receptionist/types";

const assistantGreeting: ChatMessage = {
  id: "assistant-greeting",
  role: "assistant",
  content:
    "Hola, soy recepción de FisioNova Clínica. Puedo ayudarte a pedir cita, cambiarla, cancelarla o resolver dudas sobre precios y tratamientos.",
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

export function ReceptionistExperience() {
  const [messages, setMessages] = useState<ChatMessage[]>([assistantGreeting]);
  const [proposedSlots, setProposedSlots] = useState<AppointmentSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(
    null,
  );
  const [pending, setPending] = useState(false);
  const [bookingPending, setBookingPending] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  async function sendEmail(type: EmailEventType, appointment: Appointment) {
    const response = await fetch("/api/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, appointment }),
    });

    await response.json();
  }

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
        body: JSON.stringify({ message }),
      });
      const payload = (await response.json()) as { action: ReceptionAction };

      addAssistantMessage(payload.action.message);
      setSelectedSlot(null);
      setProposedSlots(
        payload.action.type === "propose_slots" ? payload.action.slots : [],
      );
    } catch {
      addAssistantMessage(
        "Ahora mismo no puedo conectar con recepción, pero puedo seguir ayudándote en modo demo. Prueba con pedir cita o consultar precios.",
      );
    } finally {
      setPending(false);
    }
  }

  function handleSelectSlot(slot: AppointmentSlot) {
    setSelectedSlot(slot);
    setProposedSlots([]);
    addAssistantMessage(
      `Perfecto. Para reservar el ${slot.date} a las ${slot.time}, necesito tu nombre, email y teléfono.`,
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
      addAssistantMessage(
        `Perfecto, ${details.patientName}. Te he reservado el ${payload.appointment.date} a las ${payload.appointment.time}. También he enviado la confirmación a ${details.patientEmail}.`,
      );
      await sendEmail("confirmation", payload.appointment);
    } catch {
      addAssistantMessage(
        "No he podido confirmar la cita ahora mismo. Prueba otra vez en unos segundos.",
      );
    } finally {
      setBookingPending(false);
    }
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <section className="relative min-h-screen w-full overflow-hidden">
        <Image
          src="/images/clinic-hero.jpg"
          alt="Sala de tratamiento de fisioterapia moderna y luminosa"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="from-charcoal/70 via-charcoal/40 to-charcoal/80 absolute inset-0 bg-gradient-to-b" />
        <div className="from-charcoal/60 absolute inset-0 bg-gradient-to-r via-transparent to-transparent" />

        <nav className="border-cream/10 bg-charcoal/55 fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b px-6 py-4 backdrop-blur-xl lg:px-12">
          <a href="#" className="text-cream flex items-center gap-2">
            <div className="bg-sage flex h-7 w-7 items-center justify-center rounded-md">
              <Sparkles
                className="text-sage-foreground h-3.5 w-3.5"
                strokeWidth={2.5}
                aria-hidden="true"
              />
            </div>
            <span className="font-display text-lg tracking-tight">
              FisioNova <span className="opacity-60">Clínica</span>
            </span>
          </a>
          <div className="text-cream/90 hidden items-center gap-6 text-sm md:flex">
            <a href="#about" className="hover:text-cream transition-colors">
              Clínica
            </a>
            <a
              href="#treatments"
              className="hover:text-cream transition-colors"
            >
              Tratamientos
            </a>
            <a href="#team" className="hover:text-cream transition-colors">
              Equipo
            </a>
            <a href="#contact" className="hover:text-cream transition-colors">
              Contacto
            </a>
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
        </nav>

        <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-6 pt-32 pb-20 lg:grid-cols-12 lg:gap-8 lg:px-12 lg:pt-40 lg:pb-28">
          <div className="animate-fade-up text-cream lg:col-span-6">
            <div className="text-cream/70 mb-6 inline-flex items-center gap-2 text-xs tracking-[0.18em] uppercase">
              <span className="animate-pulse-dot bg-sage h-1.5 w-1.5 rounded-full" />
              Fisioterapia en Madrid · cita online
            </div>
            <h1 className="font-display text-cream text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
              Fisioterapia para
              <br />
              <span className="text-accent italic drop-shadow-[0_2px_14px_rgba(0,0,0,0.65)]">
                moverte sin dolor
              </span>
            </h1>
            <p className="text-cream/80 mt-6 max-w-xl text-lg leading-relaxed">
              Tratamientos personalizados para dolor de espalda, lesiones
              deportivas y recuperación funcional. Reserva tu cita hablando con
              recepción, sin llamadas ni formularios largos.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#chat"
                className="bg-cream text-charcoal hover:bg-cream/90 inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-medium transition-colors"
              >
                Reservar cita <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#treatments"
                className="border-cream/30 text-cream hover:bg-cream/10 inline-flex items-center gap-2 rounded-md border px-5 py-3 text-sm font-medium transition-colors"
              >
                Ver tratamientos
              </a>
            </div>
          </div>

          <div
            id="chat"
            className="animate-fade-up flex flex-col items-center gap-4 lg:col-span-6 lg:items-end"
          >
            <ChatPanel
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
          className="bg-charcoal/70 fixed inset-0 z-50 flex items-center justify-center px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Chat de recepción"
        >
          <button
            type="button"
            className="text-cream hover:bg-cream/10 absolute top-5 right-5 inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors"
            onClick={() => setIsChatModalOpen(false)}
          >
            <X className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Cerrar chat</span>
          </button>
          <ChatPanel
            mode="modal"
            inputId="receptionist-message-modal"
            messages={messages}
            pending={pending}
            proposedSlots={proposedSlots}
            selectedSlot={selectedSlot}
            bookingPending={bookingPending}
            onSubmit={handleSubmit}
            onSelectSlot={handleSelectSlot}
            onConfirmBooking={handleConfirmBooking}
          />
        </div>
      ) : null}

      <AboutSection />
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
                className="border-border bg-card rounded-xl border p-5"
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
    <section className="bg-charcoal text-cream overflow-hidden px-6 py-20 lg:px-12 lg:py-28">
      <div className="reveal-up mx-auto grid max-w-7xl items-end gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
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
        <div className="grid gap-4 lg:col-span-8 lg:grid-cols-5">
          <div className="premium-photo relative min-h-[360px] overflow-hidden rounded-xl lg:col-span-3">
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
                  className="premium-photo relative min-h-[170px] overflow-hidden rounded-xl"
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
    <section id="how" className="bg-secondary/40 px-6 py-24 lg:px-12 lg:py-32">
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

        <ol className="border-border bg-border grid overflow-hidden rounded-xl border md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="group bg-background hover:bg-secondary/40 relative flex flex-col gap-4 p-8 transition-colors lg:p-10"
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
    <section id="treatments" className="px-6 py-24 lg:px-12 lg:py-32">
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
        <div className="grid gap-6 md:grid-cols-3">
          {treatments.map((treatment) => (
            <article
              key={treatment.id}
              className="premium-card border-border bg-card hover:border-sage/40 group overflow-hidden rounded-xl border transition-colors"
            >
              <div className="relative aspect-[5/4] overflow-hidden">
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
      className="bg-charcoal text-cream px-6 py-24 lg:px-12 lg:py-32"
    >
      <div className="reveal-up mx-auto grid max-w-7xl gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <span className="text-sage text-xs tracking-[0.18em] uppercase">
            Equipo
          </span>
          <h2 className="font-display mt-3 text-3xl leading-tight lg:text-5xl">
            Fisios que escuchan antes de tratar
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:col-span-8">
          {therapists.map((therapist) => (
            <article
              key={therapist.id}
              className="group border-cream/15 bg-cream/5 overflow-hidden rounded-xl border"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
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
    <section className="px-6 py-24 lg:px-12 lg:py-32">
      <div className="reveal-up mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-6">
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
        <div className="glass shadow-elegant border-border/60 rounded-xl border p-6 lg:col-span-6">
          <ul className="space-y-4 text-sm">
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
    <section className="bg-secondary/40 px-6 py-24 lg:px-12 lg:py-32">
      <div className="reveal-up mx-auto grid max-w-7xl gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <span className="text-sage text-xs tracking-[0.18em] uppercase">
            Primera visita
          </span>
          <h2 className="font-display mt-3 text-3xl leading-tight lg:text-5xl">
            Llegas, valoramos y sales con un plan claro
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3 lg:col-span-7">
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
              className="border-border bg-card rounded-xl border p-6"
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
      className="bg-secondary/40 px-6 py-24 lg:px-12 lg:py-32"
    >
      <div className="reveal-up mx-auto grid max-w-7xl gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
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
        <div className="grid gap-4 md:grid-cols-2 lg:col-span-7">
          {contactItems.map((item) => (
            <div
              key={item.label}
              className="border-border bg-card rounded-xl border p-6"
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
    <section className="px-6 py-24 lg:px-12 lg:py-32">
      <div className="reveal-up mx-auto max-w-4xl">
        <span className="text-sage text-xs tracking-[0.18em] uppercase">
          Dudas frecuentes
        </span>
        <h2 className="font-display mt-3 text-3xl leading-tight lg:text-5xl">
          Antes de venir
        </h2>
        <div className="border-border bg-card mt-10 divide-y rounded-xl border">
          {faqs.map((faq) => (
            <article key={faq.question} className="p-6">
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
      className="bg-charcoal text-cream relative overflow-hidden px-6 py-28 lg:px-12 lg:py-40"
    >
      <div className="relative mx-auto max-w-3xl text-center">
        <h2 className="font-display text-cream text-4xl leading-tight lg:text-6xl">
          Reserva tu cita en <span className="text-sage italic">FisioNova</span>
        </h2>
        <p className="text-cream/70 mt-6 text-lg">
          Nuestro equipo te ayuda a encontrar el tratamiento y la hora que mejor
          encajan contigo.
        </p>
        <a
          href="#chat"
          className="bg-cream text-charcoal hover:bg-sage hover:text-sage-foreground mt-10 inline-flex items-center gap-2 rounded-md px-6 py-3.5 text-sm font-medium transition-colors"
        >
          Reservar cita <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-charcoal border-cream/10 text-cream/60 border-t px-6 py-8 lg:px-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm md:flex-row md:items-center md:justify-between">
        <p>FisioNova Clínica · Demo portfolio</p>
        <div className="flex gap-4">
          <a href="#treatments" className="hover:text-cream transition-colors">
            Tratamientos
          </a>
          <a href="#contact" className="hover:text-cream transition-colors">
            Contacto
          </a>
          <Link href="/medico" className="hover:text-cream transition-colors">
            Área clínica
          </Link>
        </div>
      </div>
    </footer>
  );
}
