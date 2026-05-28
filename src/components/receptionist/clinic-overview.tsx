import { Activity, Clock, MapPin, Phone, ShieldCheck } from "lucide-react";

import { clinicProfile, treatments } from "@/lib/receptionist/demo-data";

export function ClinicOverview() {
  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.7fr)]">
      <div className="relative min-h-[500px] overflow-hidden rounded-lg bg-zinc-950 text-zinc-50 shadow-[0_24px_80px_rgba(24,35,38,0.24)]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-70"
          style={{
            backgroundImage:
              "url('https://images.pexels.com/photos/20860582/pexels-photo-20860582.jpeg?auto=compress&cs=tinysrgb&w=1600')",
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,28,0.9),rgba(15,23,28,0.64)_42%,rgba(15,23,28,0.18))]" />

        <div className="relative flex min-h-[500px] flex-col justify-between p-7 sm:p-10">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-md bg-zinc-50/12 px-3 py-2 font-medium backdrop-blur-sm">
              Clinica de fisioterapia
            </span>
            <span className="rounded-md bg-emerald-200 px-3 py-2 font-semibold text-emerald-950">
              Recepcion IA activa
            </span>
          </div>

          <div className="max-w-2xl space-y-6">
            <h1 className="text-5xl leading-[0.96] font-semibold text-balance sm:text-7xl">
              {clinicProfile.name}
            </h1>
            <p className="max-w-xl text-lg leading-8 text-zinc-100/88">
              {clinicProfile.tagline} La agenda, el chat y los emails trabajan
              juntos para que pedir cita parezca hablar con recepcion.
            </p>
          </div>

          <div className="grid gap-3 text-sm text-zinc-100 sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-emerald-200" aria-hidden="true" />
              <span>{clinicProfile.openingHours}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-emerald-200" aria-hidden="true" />
              <span>{clinicProfile.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="size-4 text-emerald-200" aria-hidden="true" />
              <span>{clinicProfile.phone}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-6 text-zinc-50 shadow-[0_18px_60px_rgba(24,35,38,0.16)]">
          <div className="flex items-center gap-3">
            <Activity className="size-5 text-emerald-200" aria-hidden="true" />
            <p className="text-sm font-medium text-zinc-300">
              Flujo de recepcion
            </p>
          </div>
          <p className="mt-5 text-3xl leading-tight font-semibold">
            Conversacion, agenda y correo en una sola demo.
          </p>
        </div>

        {treatments.map((treatment) => (
          <article
            key={treatment.id}
            className="border-border bg-card rounded-lg border p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold tracking-tight">
                {treatment.name}
              </h2>
              <span className="bg-secondary text-secondary-foreground rounded-md px-2.5 py-1 text-sm font-semibold">
                {treatment.price} EUR
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              {treatment.description}
            </p>
            <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-zinc-500">
              <ShieldCheck
                className="text-primary size-3.5"
                aria-hidden="true"
              />
              {treatment.durationMinutes} min
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
