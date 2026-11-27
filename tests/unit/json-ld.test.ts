import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "@/lib/json-ld";

describe("serializeJsonLd", () => {
  it("escapes HTML-significant characters", () => {
    const result = serializeJsonLd({ name: "</script><script>alert(1)</script>", amp: "a&b", gt: ">" });
    expect(result).not.toContain("</script>");
    expect(result).toContain("\\u003c/script\\u003e");
    expect(result).toContain("a\\u0026b");
    expect(result).toContain("\\u003e");
  });

  it("keeps normal JSON valid", () => {
    const value = { "@type": "Organization", name: "Yayasan Nuurul Muttaqiin" };
    expect(JSON.parse(serializeJsonLd(value).replace(/\\u003c/g, "<").replace(/\\u003e/g, ">").replace(/\\u0026/g, "&"))).toEqual(value);
  });
});