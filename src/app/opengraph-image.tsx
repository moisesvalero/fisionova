import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";

export const alt = siteConfig.name;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "#f4efe4",
        color: "#16211f",
        display: "flex",
        fontFamily: "Arial, Helvetica, sans-serif",
        height: "100%",
        overflow: "hidden",
        padding: "64px",
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          background: "#16211f",
          borderRadius: "999px",
          height: "520px",
          opacity: 0.08,
          position: "absolute",
          right: "-180px",
          top: "-170px",
          width: "520px",
        }}
      />
      <div
        style={{
          background: "#97b68c",
          borderRadius: "999px",
          bottom: "-220px",
          height: "460px",
          left: "-140px",
          opacity: 0.22,
          position: "absolute",
          width: "460px",
        }}
      />

      <div
        style={{
          alignItems: "stretch",
          border: "1px solid rgba(22, 33, 31, 0.14)",
          borderRadius: "34px",
          display: "flex",
          height: "100%",
          overflow: "hidden",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            background: "#16211f",
            color: "#f4efe4",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "54px",
            width: "42%",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div
              style={{
                alignItems: "center",
                display: "flex",
                gap: 18,
              }}
            >
              <div
                style={{
                  alignItems: "center",
                  background: "#97b68c",
                  borderRadius: 14,
                  color: "#16211f",
                  display: "flex",
                  fontSize: 34,
                  fontWeight: 900,
                  height: 58,
                  justifyContent: "center",
                  width: 58,
                }}
              >
                +
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <div style={{ fontSize: 34, fontWeight: 800 }}>FisioNova</div>
                <div style={{ color: "#dfe7d6", fontSize: 20 }}>Clinica</div>
              </div>
            </div>

            <div
              style={{
                color: "#dfe7d6",
                fontSize: 25,
                lineHeight: 1.35,
              }}
            >
              Recepcionista IA, agenda privada y confirmacion por email.
            </div>
          </div>

          <div
            style={{
              color: "#97b68c",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Portfolio tecnico
          </div>
        </div>

        <div
          style={{
            background: "#f7f7f4",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "58px 64px",
            width: "58%",
          }}
        >
          <div
            style={{
              color: "#6f8e65",
              fontSize: 25,
              fontWeight: 800,
              letterSpacing: "0.16em",
              marginBottom: 22,
              textTransform: "uppercase",
            }}
          >
            Demo web app
          </div>
          <div
            style={{
              fontSize: 70,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 0.95,
              maxWidth: 620,
            }}
          >
            Citas de fisioterapia con Clara, recepcionista IA.
          </div>
          <div
            style={{
              color: "#4f5e59",
              fontSize: 28,
              lineHeight: 1.35,
              marginTop: 28,
              maxWidth: 620,
            }}
          >
            Next.js, OpenAI, Resend, Supabase opcional y panel medico privado.
          </div>
          <div
            style={{
              borderTop: "1px solid rgba(22, 33, 31, 0.12)",
              color: "#6f8e65",
              fontSize: 24,
              fontWeight: 700,
              marginTop: 42,
              paddingTop: 22,
            }}
          >
            proyecto-ia-recepcionista.vercel.app
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
