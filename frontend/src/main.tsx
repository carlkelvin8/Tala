import React from "react" // Import the React library, required for JSX transformation and React features
import ReactDOM from "react-dom/client" // Import ReactDOM's client-side rendering API (React 18+)
import { BrowserRouter } from "react-router-dom" // Import BrowserRouter to enable HTML5 history-based client-side routing
import { QueryClientProvider } from "@tanstack/react-query" // Import the provider that makes the React Query client available to all child components
import { Toaster } from "sonner" // Import the Toaster component from sonner to render toast notifications
import { App } from "./App" // Import the root App component that defines all routes
import { queryClient } from "./lib/queryClient" // Import the pre-configured React Query client instance
import "./index.css" // Import global CSS styles including Tailwind base styles

// Find the DOM element with id="root" (defined in index.html), assert it's non-null with !, and create a React root on it
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode> {/* Wrap the entire app in StrictMode to detect potential problems and warn about deprecated APIs in development */}
    <QueryClientProvider client={queryClient}> {/* Provide the React Query client to all descendant components so they can use useQuery/useMutation */}
      <BrowserRouter> {/* Wrap the app in BrowserRouter to enable routing via the browser's History API */}
        <App /> {/* Render the root App component which contains all route definitions */}
      </BrowserRouter>
      <Toaster richColors position="top-right" /> {/* Render the toast notification container; richColors enables colored variants, position places it top-right */}
    </QueryClientProvider>
  </React.StrictMode>
)
