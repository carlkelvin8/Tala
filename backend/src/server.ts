// Import the serve function from the Hono Node.js adapter to start an HTTP server
import { serve } from "@hono/node-server"
// Import the configured Hono application instance with all routes and middleware
import { app } from "./app.js"
// Import the validated environment config to read the port number
import { env } from "./lib/env.js"
// Import Prisma client for graceful shutdown
import { prisma } from "./lib/prisma.js"

// Start the HTTP server, binding the Hono app's fetch handler to the configured port
const server = serve({
  fetch: app.fetch, // Hono's fetch handler processes every incoming request
  port: env.port    // Port number read from the PORT environment variable (default: 4000)
})

// Print a startup message to the console so the developer knows the server is running
console.log(`NSTP API running on http://localhost:${env.port}`)

// Graceful shutdown: close Prisma connection and HTTP server on SIGTERM/SIGINT
function shutdown(signal: string) {
  console.log(`${signal} received, shutting down gracefully...`)
  server.close(() => {
    prisma.$disconnect().then(() => {
      process.exit(0)
    })
  })
}

process.on("SIGTERM", () => shutdown("SIGTERM"))
process.on("SIGINT", () => shutdown("SIGINT"))
