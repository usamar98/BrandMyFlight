import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#d8ff3e",
        color: "#11110f",
        display: "flex",
        fontSize: 25,
        fontWeight: 900,
        height: "100%",
        justifyContent: "center",
        letterSpacing: "-0.12em",
        width: "100%",
      }}
    >
      S/D
    </div>,
    size,
  );
}
