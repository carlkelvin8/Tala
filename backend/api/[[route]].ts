import { handle } from "hono/vercel"
import { app } from "../dist/app"

export const config = {
  runtime: "nodejs22.x",
}

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)
export const OPTIONS = handle(app)
