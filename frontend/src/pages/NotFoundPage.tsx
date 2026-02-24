export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="rounded-xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
        <div className="text-2xl font-semibold text-slate-900">Page not found</div>
        <div className="mt-2 text-sm text-slate-500">The page you are looking for does not exist.</div>
      </div>
    </div>
  )
}
