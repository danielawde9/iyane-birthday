import { describe, expect, it } from "vitest";
import { getTheme } from "./index";

describe("theme registry", () => {
  it("resolves year two to the astronaut theme", () => {
    const theme = getTheme("tiny-astronaut");

    expect(theme.slug).toBe("tiny-astronaut");
    expect(theme.name).toBe("The Tiny Astronaut");
    expect(theme.palette.accent).toBe("#FF7A1A");
  });

  it("keeps the old year-two slug as a back-compat alias", () => {
    expect(getTheme("sweet-sophomore").slug).toBe("tiny-astronaut");
  });
});
