import { env } from "./env.js"

export const mailConfigured = Boolean(env.resendApiKey)

/* Sends a plain email through the Resend HTTP API (no SDK dependency). */
export async function sendMail(to: string, subject: string, text: string) {
  if (!env.resendApiKey) {
    throw new Error("Email delivery is not configured")
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.resendApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.mailFrom, to, subject, text })
  })
  if (!response.ok) {
    throw new Error(`Email delivery failed (${response.status})`)
  }
}
