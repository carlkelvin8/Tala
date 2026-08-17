import { useEffect } from "react"

export function useUnsavedChanges(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const preventUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", preventUnload)
    return () => window.removeEventListener("beforeunload", preventUnload)
  }, [enabled])
}
