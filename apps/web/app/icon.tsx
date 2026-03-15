import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
          borderRadius: "24px",
        }}
      >
        <span
          style={{
            fontSize: 200,
            color: "white",
            fontWeight: 700,
          }}
        >
          #
        </span>
      </div>
    ),
    { ...size }
  );
}
