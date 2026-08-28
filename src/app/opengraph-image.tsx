import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#11110f",
        color: "#11110f",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        padding: 50,
        width: "100%",
      }}
    >
      <div
        style={{
          background: "#f3f0e7",
          border: "3px solid #c8ff25",
          borderRadius: 28,
          display: "flex",
          flexDirection: "column",
          height: 520,
          overflow: "hidden",
          transform: "rotate(-1deg)",
          width: 1080,
        }}
      >
        <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", padding: "28px 34px 20px" }}>
          <div style={{ alignItems: "center", display: "flex", gap: 14 }}>
            <div style={{ alignItems: "center", background: "#c8ff25", borderRadius: 999, display: "flex", fontSize: 28, height: 52, justifyContent: "center", width: 52 }}>✈</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <strong style={{ fontSize: 29, letterSpacing: "-0.05em" }}>INDIE AIR</strong>
              <span style={{ fontSize: 10, letterSpacing: "0.16em" }}>BUILDERS IN MOTION</span>
            </div>
          </div>
          <strong style={{ fontSize: 36, letterSpacing: "-0.06em" }}>SPONSOR PASS</strong>
        </div>
        <div style={{ background: "#c8ff25", borderBottom: "2px solid #11110f", borderTop: "2px solid #11110f", display: "flex", fontSize: 13, fontWeight: 800, justifyContent: "center", letterSpacing: "0.14em", padding: 10 }}>
          PROMOTIONAL DESIGN — NOT VALID FOR TRAVEL
        </div>
        <div style={{ alignItems: "center", display: "flex", flex: 1, justifyContent: "space-between", padding: "10px 38px" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 12, letterSpacing: "0.12em" }}>LAHORE</span>
            <strong style={{ fontSize: 104, letterSpacing: "-0.09em", lineHeight: 0.9 }}>LHE</strong>
          </div>
          <div style={{ alignItems: "center", display: "flex", fontSize: 50, gap: 22 }}><span>······</span><span>✈</span><span>······</span></div>
          <div style={{ alignItems: "flex-end", display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 12, letterSpacing: "0.12em" }}>NEW YORK</span>
            <strong style={{ fontSize: 104, letterSpacing: "-0.09em", lineHeight: 0.9 }}>JFK</strong>
          </div>
        </div>
        <div style={{ alignItems: "flex-end", borderTop: "2px solid #11110f", display: "flex", justifyContent: "space-between", padding: "24px 34px 28px" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 13, letterSpacing: "0.12em" }}>BRANDMYFLIGHT</span>
            <strong style={{ fontSize: 49, letterSpacing: "-0.06em" }}>Ten brands. One funded flight.</strong>
          </div>
          <div style={{ background: "#11110f", color: "#c8ff25", display: "flex", fontSize: 16, fontWeight: 800, padding: "15px 19px" }}>10 POSITIONS · $750</div>
        </div>
      </div>
    </div>,
    size,
  );
}
