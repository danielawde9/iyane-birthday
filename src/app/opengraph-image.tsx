import { ImageResponse } from "next/og";

export const alt = "Iyane · The Greatest Little Show on Earth — a keepsake gallery";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social-share card in the watercolor palette (parchment + madder red + pale
 *  ochre + sepia ink). Deliberately shape-based with system serif/sans: this is
 *  Satori, not a browser — it cannot load the site's webfonts without fetching
 *  them, and it supports neither blend modes nor the painted art's alpha
 *  compositing. So it echoes the palette rather than the illustration. */
export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#F7EEDD",
          color: "#3A2B20",
          fontFamily: 'Georgia, "Times New Roman", serif',
        }}
      >
        {/* heavy ink frame */}
        <div
          style={{
            position: "absolute",
            inset: 22,
            display: "flex",
            border: "10px solid #3A2B20",
            boxShadow: "inset 0 0 0 5px #F7EEDD, inset 0 0 0 6px #3A2B20",
          }}
        />

        {/* top red banner */}
        <div
          style={{
            position: "absolute",
            top: 32,
            left: 32,
            right: 32,
            display: "flex",
            justifyContent: "center",
            padding: "12px 0",
            background: "#A3322E",
            borderBottom: "4px solid #3A2B20",
            color: "#F2DDB4",
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 8,
          }}
        >
          STEP RIGHT UP · THE GREATEST LITTLE SHOW        </div>

        {/* bottom red banner */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            left: 32,
            right: 32,
            display: "flex",
            justifyContent: "center",
            padding: "12px 0",
            background: "#A3322E",
            borderTop: "4px solid #3A2B20",
            color: "#F2DDB4",
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 8,
          }}
        >
          IYANE'S FIRST BIRTHDAY · MMXXVI        </div>

        {/* Center stack */}
        <div
          style={{
            display: "flex",
            color: "#3A2B20",
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            letterSpacing: 6,
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          ONE NIGHT ONLY
        </div>

        {/* gold medal star */}
        <div
          style={{
            display: "flex",
            width: 84,
            height: 84,
            background: "#F2DDB4",
            marginTop: 14,
            clipPath:
              "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
          }}
        />

        <div
          style={{
            display: "flex",
            fontSize: 168,
            marginTop: 4,
            lineHeight: 1,
            color: "#A3322E",
            fontFamily: '"Arial Black", Helvetica, sans-serif',
            fontWeight: 900,
            letterSpacing: -4,
          }}
        >
          IYANE
        </div>

        <div style={{ display: "flex", width: 320, height: 4, background: "#3A2B20", marginTop: 22 }} />

        <div
          style={{
            display: "flex",
            fontSize: 28,
            marginTop: 22,
            color: "#3A2B20",
            fontStyle: "italic",
          }}
        >
          the greatest little show on earth
        </div>
      </div>
    ),
    { ...size },
  );
}
