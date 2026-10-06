import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "sonner"
import { App } from "./App"
import { queryClient } from "./lib/queryClient"
import { ErrorBoundary } from "./components/ErrorBoundary"
import "./index.css"

// After a new deploy, a tab that still holds the old app can fail to load a page chunk whose
// file no longer exists (the page then looks "stuck", e.g. after login). Reload once to pick up the new build.
window.addEventListener("vite:preloadError", () => {
  try {
    if (sessionStorage.getItem("chunk-reload") === "1") return
    sessionStorage.setItem("chunk-reload", "1")
  } catch { /* storage unavailable: reload anyway */ }
  window.location.reload()
})

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* offline mode unavailable — app still works normally */
    })
  })
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <App />
        </BrowserRouter>
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
