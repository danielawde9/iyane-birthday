/**
 * Shared QR rendering options.
 *
 * The `qrcode` library rasterises to a data URL, so it needs literal hex — it
 * cannot read CSS custom properties. That's why these colors live here rather
 * than following the active theme: three separate call sites (the home hero, the
 * uploader, and the printable poster) had each hard-coded their own copy of the
 * old palette, and they drifted out of sync with the site.
 *
 * Keep the pair high-contrast whatever the theme does. Scanners need luminance
 * separation far more than they need brand accuracy, and a QR that fails to scan
 * on a phone in a dim room is worse than one that is slightly off-palette. The
 * current pair measures 11.8:1.
 */
export const QR_COLORS = {
  dark: "#3A2B20", // sepia ink
  light: "#F7EEDD", // parchment
} as const;

/** Options for a QR rendered onto the site's paper. `width` varies by call site. */
export function qrOptions(width: number) {
  return { margin: 1, width, color: { ...QR_COLORS } };
}
