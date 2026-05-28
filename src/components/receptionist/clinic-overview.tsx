import { Clock, MapPin, Phone, ShieldCheck } from "lucide-react";

import { clinicProfile, treatments } from "@/lib/receptionist/demo-data";

export function ClinicOverview() {
  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <p className="text-primary text-sm font-medium tracking-[0.18em] uppercase">
          Clinica de fisioterapia
        </p>
        <h1 className="max-w-2xl text-4xl font-semibold text-balance sm:text-6xl">
          {clinicProfile.name}
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-zinc-700">
          {clinicProfile.tagline} Nuestra recepcionista IA puede atender dudas,
          buscar huecos y dejar la cita preparada en la agenda.
        </p>
      </div>

      <div className="grid gap-3 text-sm text-zinc-700 sm:grid-cols-3">
        <div className="flex items-center gap-2">
          <Clock className="text-primary size-4" aria-hidden="true" />
          <span>{clinicProfile.openingHours}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="text-primary size-4" aria-hidden="true" />
          <span>{clinicProfile.address}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="text-primary size-4" aria-hidden="true" />
          <span>{clinicProfile.phone}</span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {treatments.map((treatment) => (
          <article
            key={treatment.id}
            className="border-border bg-card rounded-lg border p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-semibold">{treatment.name}</h2>
              <span className="text-primary text-sm font-semibold">
                {treatment.price} EUR
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {treatment.description}
            </p>
            <p className="mt-3 flex items-center gap-2 text-xs font-medium text-zinc-500">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              {treatment.durationMinutes} min
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
