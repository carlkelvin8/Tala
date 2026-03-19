// 404 Not Found page component — rendered for any URL that doesn't match a defined route
export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6"> {/* Full viewport height flex container, centered content, light gray background, horizontal padding */}
      <div className="rounded-xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm"> {/* Card container: rounded corners, border, white background, padding, centered text, subtle shadow */}
        <div className="text-2xl font-semibold text-slate-900">Page not found</div> {/* Large bold heading */}
        <div className="mt-2 text-sm text-slate-500">The page you are looking for does not exist.</div> {/* Smaller muted description text with top margin */}
      </div>
    </div>
  )
}
