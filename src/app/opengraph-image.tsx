import { ImageResponse } from "next/og";

export const alt = "Iyane · Year One — a keepsake gallery";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social-share card (ink navy + gold paper), drawn with shapes + system serif
 *  to echo the keepsake look — no external fonts/emoji to fetch. */
export default async function OpengraphImage() {
  const wingBase = { width: 0, height: 0, borderTop: "24px solid transparent", borderBottom: "24px solid transparent" };
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
          background: "#0E2240",
          color: "#F6EFE2",
          fontFamily: 'Georgia, "Times New Roman", serif',
        }}
      >
        <div style={{ display: "flex", color: "#C9A24B", letterSpacing: 14, fontSize: 24 }}>
          A KEEPSAKE · YEAR ONE
        </div>

        {/* bow-tie motif */}
        <div style={{ display: "flex", alignItems: "center", marginTop: 26 }}>
          <div style={{ ...wingBase, borderLeft: "38px solid #C9A24B" }} />
          <div style={{ width: 16, height: 28, borderRadius: 5, background: "#E0C788", margin: "0 -4px" }} />
          <div style={{ ...wingBase, borderRight: "38px solid #C9A24B" }} />
        </div>

        <div style={{ display: "flex", fontStyle: "italic", fontSize: 168, marginTop: 14, lineHeight: 1 }}>Iyane</div>
        <div style={{ display: "flex", width: 300, height: 1, background: "#C9A24B", marginTop: 28, opacity: 0.8 }} />
        <div style={{ display: "flex", fontStyle: "italic", fontSize: 30, marginTop: 26, opacity: 0.82 }}>
          a page written by the room
        </div>
      </div>
    ),
    { ...size },
  );
}
