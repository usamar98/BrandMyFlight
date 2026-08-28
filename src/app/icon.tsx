import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#f3f0e7",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <div
        style={{
          alignItems: "center",
          background: "#11110f",
          borderRadius: 7,
          color: "#f3f0e7",
          display: "flex",
          flexDirection: "column",
          height: 38,
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
          transform: "rotate(-7deg)",
          width: 52,
        }}
      >
        <div style={{ background: "#f3f0e7", borderRadius: 999, height: 11, left: -6, position: "absolute", top: 14, width: 11 }} />
        <div style={{ background: "#f3f0e7", borderRadius: 999, height: 11, position: "absolute", right: -6, top: 14, width: 11 }} />
        <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: "-0.06em", lineHeight: 1 }}>BMF</div>
        <div style={{ alignItems: "center", display: "flex", height: 7, justifyContent: "space-between", marginTop: 4, width: 30 }}>
          <div style={{ background: "#c8ff25", borderRadius: 999, height: 5, width: 5 }} />
          <div style={{ background: "#c8ff25", height: 2, width: 20 }} />
          <div style={{ background: "#c8ff25", borderRadius: 999, height: 5, width: 5 }} />
        </div>
      </div>
    </div>,
    size,
  );
}
