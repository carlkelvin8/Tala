import nodemailer from "nodemailer"
import { env } from "./env.js"

const smtpConfigured = Boolean(env.smtpUser && env.smtpPass)
export const mailConfigured = smtpConfigured || Boolean(env.resendApiKey)

/* Sends a plain-text email via SMTP (e.g. Gmail app password) or, as a fallback, the Resend HTTP API. */
export async function sendMail(to: string, subject: string, text: string) {
  if (smtpConfigured) {
    const transport = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: { user: env.smtpUser, pass: env.smtpPass }
    })
    await transport.sendMail({ from: env.mailFrom, to, subject, text })
    return
  }
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
