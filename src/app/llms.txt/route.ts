import { siteConfig } from "@/config/site";

export function GET() {
  const body = `# ${siteConfig.name}

${siteConfig.description}

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn-style components
- Supabase optional integration
- Sanity optional integration

## Useful paths

- /: FisioNova public demo
- /medico: private doctor agenda demo
- /sitemap.xml: sitemap
- /robots.txt: crawler policy

## Repository

https://github.com/moisesvalero/fisionova
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
