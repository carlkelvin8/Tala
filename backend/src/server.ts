// Import the serve function from the Hono Node.js adapter to start an HTTP server
import { serve } from "@hono/node-server"
// Import the configured Hono application instance with all routes and middleware
import { app } from "./app.js"
// Import the validated environment config to read the port number
import { env } from "./lib/env.js"

// Start the HTTP server, binding the Hono app's fetch handler to the configured port
serve({
  fetch: app.fetch, // Hono's fetch handler processes every incoming request
  port: env.port    // Port number read from the PORT environment variable (default: 4000)
})

// Print a startup message to the console so the developer knows the server is running
console.log(`NSTP API running on http://localhost:${env.port}`)
