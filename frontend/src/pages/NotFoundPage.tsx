import { useNavigate } from "react-router-dom"
import { Button } from "../components/ui/button"
import { ArrowLeft, Home } from "lucide-react"
import { motion } from "framer-motion"

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <motion.div
        className="max-w-md text-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6 text-7xl font-black text-navy/10">404</div>
        <h1 className="text-2xl font-bold text-black">Page not found</h1>
        <p className="mt-2 text-sm text-darksilver">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 bg-navy text-white hover:bg-navy/90"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
