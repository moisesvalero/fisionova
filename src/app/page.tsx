import { JsonLd } from "@/components/seo/json-ld";
import { ReceptionistExperience } from "@/components/receptionist/receptionist-experience";
import {
  createSoftwareApplicationJsonLd,
  createWebsiteJsonLd,
} from "@/lib/seo";

export default function Home() {
  return (
    <main className="bg-background text-foreground min-h-screen">
      <JsonLd data={createWebsiteJsonLd()} />
      <JsonLd data={createSoftwareApplicationJsonLd()} />
      <ReceptionistExperience />
    </main>
  );
}
