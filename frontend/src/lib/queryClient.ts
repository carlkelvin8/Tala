import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5_000, // Data is fresh for 5 seconds
      refetchOnWindowFocus: true, // Refetch when window regains focus
      refetchInterval: 10_000, // Auto-refetch every 10 seconds
      refetchIntervalInBackground: false // Don't refetch when tab is not visible
    }
  }
})
