import type { Metadata } from "next";

import { DoctorAgenda } from "@/components/receptionist/doctor-agenda";

export const metadata: Metadata = {
  title: "Panel de recepcion",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DoctorPage() {
  return <DoctorAgenda />;
}
