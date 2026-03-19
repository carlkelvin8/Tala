import { QueryClient } from "@tanstack/react-query" // Import the QueryClient class from React Query to configure caching behavior

// Create and export a single shared QueryClient instance with custom default options
export const queryClient = new QueryClient({
  defaultOptions: { // Apply these options to all queries unless overridden at the query level
    queries: {
      staleTime: 5_000, // Data is considered fresh for 5 seconds; no refetch will happen within this window
      refetchOnWindowFocus: true, // Automatically refetch queries when the browser window regains focus
      refetchInterval: 10_000, // Automatically refetch active queries every 10 seconds in the background
      refetchIntervalInBackground: false // Do not refetch when the browser tab is not visible/active
    }
  }
})
