import { describe, expect, it } from "vitest"
import { validateAvatarDataUrl } from "../src/lib/imageData.js"

describe("avatar data validation", () => {
  it("accepts supported images whose bytes match the MIME type", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])
    const value = `data:image/png;base64,${png.toString("base64")}`
    expect(validateAvatarDataUrl(value)).toBe(value)
  })

  it("rejects MIME spoofing", () => {
    const fake = `data:image/png;base64,${Buffer.from("not an image").toString("base64")}`
    expect(() => validateAvatarDataUrl(fake)).toThrow("does not match")
  })

  it("rejects active SVG content", () => {
    const svg = `data:image/svg+xml;base64,${Buffer.from("<svg><script/></svg>").toString("base64")}`
    expect(() => validateAvatarDataUrl(svg)).toThrow("PNG, JPEG, or WebP")
  })
})
