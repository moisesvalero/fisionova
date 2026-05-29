import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#16211f",
        borderRadius: "16px",
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
          height: 38,
          opacity: 0.16,
          position: "absolute",
          right: -10,
          top: -8,
          width: 38,
        }}
      />
      <div
        style={{
          background: "#97b68c",
          borderRadius: "999px",
          height: 38,
          position: "absolute",
          width: 12,
        }}
      />
      <div
        style={{
          background: "#97b68c",
          borderRadius: "999px",
          height: 12,
          position: "absolute",
          width: 38,
        }}
      />
      <div
        style={{
          border: "4px solid #f4efe4",
          borderLeftColor: "transparent",
          borderRadius: "999px",
          bottom: 11,
          height: 30,
          position: "absolute",
          right: 10,
          transform: "rotate(-24deg)",
          width: 30,
        }}
      />
    </div>,
    size,
  );
}
