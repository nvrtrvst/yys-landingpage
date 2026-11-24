import { describe, expect, it } from "vitest";
import { contrastInk } from "@/components/unit-site/unit-site-color";

describe("contrastInk", () => {
  it("uses dark ink on light backgrounds", () => {
    expect(contrastInk("#fef08a")).toBe("#1b2b1f");
    expect(contrastInk("#ffffff")).toBe("#1b2b1f");
  });

  it("uses white ink on dark backgrounds", () => {
    expect(contrastInk("#14532d")).toBe("#ffffff");
    expect(contrastInk("#000000")).toBe("#ffffff");
  });

  it("falls back safely on invalid hex", () => {
    expect(contrastInk("nope")).toBe("#ffffff");
    expect(contrastInk("#abc")).toBe("#ffffff");
  });
});