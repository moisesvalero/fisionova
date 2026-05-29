import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#16211f",
        borderRadius: "44px",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          background: "#dfe7d6",
          borderRadius: "999px",
          height: 104,
          opacity: 0.14,
          position: "absolute",
          right: -24,
          top: -20,
          width: 104,
        }}
      />
      <div
        style={{
          background: "#97b68c",
          borderRadius: "999px",
          height: 104,
          position: "absolute",
          width: 32,
        }}
      />
      <div
        style={{
          background: "#97b68c",
          borderRadius: "999px",
          height: 32,
          position: "absolute",
          width: 104,
        }}
      />
      <div
        style={{
          border: "10px solid #f4efe4",
          borderLeftColor: "transparent",
          borderRadius: "999px",
          bottom: 34,
          height: 74,
          position: "absolute",
          right: 30,
          transform: "rotate(-24deg)",
          width: 74,
        }}
      />
    </div>,
    size,
  );
}
