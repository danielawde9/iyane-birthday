import { ImageResponse } from "next/og";

export const alt = "Iyane · The Grand Jubilee — a keepsake gallery";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social-share card (parchment + Big Top Red + Aged Gold + Midnight ink),
 *  drawn with shapes + system serif/sans to echo the vintage playbill look —
 *  no external fonts/emoji to fetch. */
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
          background: "#FFF8F0",
          color: "#221B03",
          fontFamily: 'Georgia, "Times New Roman", serif',
        }}
      >
        {/* heavy ink frame */}
        <div
          style={{
            position: "absolute",
            inset: 22,
            display: "flex",
            border: "10px solid #221B03",
            boxShadow: "inset 0 0 0 5px #FFF8F0, inset 0 0 0 6px #221B03",
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
            background: "#AF101A",
            borderBottom: "4px solid #221B03",
            color: "#FBC02D",
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
            background: "#AF101A",
            borderTop: "4px solid #221B03",
            color: "#FBC02D",
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 8,
          }}
        >
          THE GRAND JUBILEE · ANNO MMXXVI        </div>

        {/* Center stack */}
        <div
          style={{
            display: "flex",
            color: "#221B03",
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
            background: "#FBC02D",
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
            color: "#AF101A",
            fontFamily: '"Arial Black", Helvetica, sans-serif',
            fontWeight: 900,
            letterSpacing: -4,
          }}
        >
          IYANE
        </div>

        <div style={{ display: "flex", width: 320, height: 4, background: "#221B03", marginTop: 22 }} />

        <div
          style={{
            display: "flex",
            fontSize: 28,
            marginTop: 22,
            color: "#221B03",
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
