import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * globals.css drives three years' identities off one set of `--v-*` variables.
 * Each `[data-theme]` block must declare the COMPLETE set, not just the values
 * it wants to change, because an archive year nests
 * `<div class="theme-canvas" data-theme="...">` inside an `<html>` running a
 * different theme — and only a complete block resets every visual decision.
 * A missing declaration silently inherits the wrong year's value from `:root`,
 * and it only shows on `/archive/[year]`, the least-visited route on the site.
 *
 * This is the ratchet: add a `--v-*` to one block and forget the others, and
 * the build goes red here instead of quietly shipping a broken archive page.
 */

const CSS = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

/** Pull the body of a top-level block whose selector list starts with `selector`. */
function blockBody(selector: string, occurrence = 0): string {
  const bodies: string[] = [];
  // Match a selector list containing `selector`, then balance to the closing brace.
  const re = new RegExp(`(^|\\n)([^{}]*${selector.replace(/[[\]"*]/g, "\\$&")}[^{}]*)\\{`, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(CSS))) {
    const start = m.index + m[0].length;
    let depth = 1;
    let i = start;
    while (i < CSS.length && depth > 0) {
      if (CSS[i] === "{") depth++;
      else if (CSS[i] === "}") depth--;
      i++;
    }
    bodies.push(CSS.slice(start, i - 1));
  }
  const body = bodies[occurrence];
  if (body === undefined) {
    throw new Error(`No block #${occurrence} found for selector containing "${selector}"`);
  }
  return body;
}

/** Every `--v-*` custom property DECLARED (not merely referenced) in a block. */
function declaredVariantVars(body: string): Set<string> {
  const names = new Set<string>();
  for (const m of body.matchAll(/(^|[;{\s])(--v-[a-z0-9-]+)\s*:/g)) names.add(m[2]!);
  return names;
}

// `:root` appears twice: the color/font block first, then the variant defaults.
const rootVariants = declaredVariantVars(blockBody(":root", 1));
const bigTop = declaredVariantVars(blockBody('[data-theme="big-top"]'));
const tinyAstronaut = declaredVariantVars(blockBody('[data-theme="tiny-astronaut"]'));

describe("globals.css variant variables", () => {
  it("defines a non-trivial variant surface in :root", () => {
    expect(rootVariants.size).toBeGreaterThan(40);
  });

  it.each([
    ["big-top", () => bigTop],
    ["tiny-astronaut", () => tinyAstronaut],
  ])("[data-theme=%s] declares the full --v-* set", (_name, get) => {
    const theme = get();
    const missing = [...rootVariants].filter((v) => !theme.has(v)).sort();
    expect(missing).toEqual([]);
  });

  it.each([
    ["big-top", () => bigTop],
    ["tiny-astronaut", () => tinyAstronaut],
  ])("[data-theme=%s] declares no --v-* that :root is missing", (_name, get) => {
    const extra = [...get()].filter((v) => !rootVariants.has(v)).sort();
    expect(extra).toEqual([]);
  });

  /**
   * The font stacks must be declared in every theme block too, for a subtler
   * reason than the --v-* set: a custom property is substituted at
   * computed-value time on the element that DECLARES it. Declared only on
   * `:root`, `--font-display-stack` resolves against `:root`'s `--th-font-*` and
   * inherits that already-resolved string downwards — so an archive year's
   * nested `.theme-canvas` renders the ROOT year's typeface no matter what it
   * sets. This caught exactly that bug once; keep it.
   */
  const FONT_STACKS = [
    "--font-display-stack",
    "--font-body-stack",
    "--font-mono-stack",
    "--font-script-stack",
  ];

  function declaredFontStacks(body: string): Set<string> {
    const names = new Set<string>();
    for (const m of body.matchAll(/(^|[;{\s])(--font-[a-z]+-stack)\s*:/g)) names.add(m[2]!);
    return names;
  }

  it.each([
    [":root", () => blockBody(":root", 0)],
    ["big-top", () => blockBody('[data-theme="big-top"]')],
    ["tiny-astronaut", () => blockBody('[data-theme="tiny-astronaut"]')],
  ])("%s declares every --font-*-stack itself", (_name, get) => {
    const declared = declaredFontStacks(get());
    expect(FONT_STACKS.filter((f) => !declared.has(f))).toEqual([]);
  });

  it("resolves each font stack through --th-font-*, so themes can override it", () => {
    for (const m of CSS.matchAll(/--font-([a-z]+)-stack:\s*([^;]+);/g)) {
      expect(m[2]).toContain(`var(--th-font-${m[1]}`);
    }
  });

  it("keeps every --v-* referenced by a component rule actually declared", () => {
    const referenced = new Set<string>();
    for (const m of CSS.matchAll(/var\((--v-[a-z0-9-]+)/g)) referenced.add(m[1]!);
    const undeclared = [...referenced].filter((v) => !rootVariants.has(v)).sort();
    expect(undeclared).toEqual([]);
  });
});
