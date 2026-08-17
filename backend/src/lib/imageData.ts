const MAX_AVATAR_BYTES = 300_000

const signatures: Record<string, (bytes: Buffer) => boolean> = {
  "image/png": (bytes) => bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  "image/jpeg": (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  "image/webp": (bytes) => bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP",
}

export function validateAvatarDataUrl(value: unknown) {
  if (typeof value !== "string") throw new Error("Invalid image data")

  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(value)
  if (!match) throw new Error("Avatar must be a PNG, JPEG, or WebP image")

  const [, mimeType, encoded] = match
  const bytes = Buffer.from(encoded, "base64")
  if (bytes.length === 0 || bytes.length > MAX_AVATAR_BYTES) {
    throw new Error("Image is too large. Please use a photo under 300 KB.")
  }
  if (!signatures[mimeType]?.(bytes)) {
    throw new Error("Image content does not match its declared format")
  }

  return value
}
