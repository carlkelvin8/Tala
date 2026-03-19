import * as React from "react" // Import all of React (needed for React.ReactNode type and JSX)
import { cn } from "../../lib/utils" // Import the cn utility for conditional/merged Tailwind class names
import { Shield } from "lucide-react" // Import the Shield icon from lucide-react for the branding logo

// Props type for the ModernAuthLayout component
type ModernAuthLayoutProps = {
  title: string // The main heading text displayed above the form (e.g. "Welcome back")
  description: string // The subtitle text displayed below the heading
  children: React.ReactNode // The form content (login or register form) rendered in the right panel
  footer?: React.ReactNode // Optional footer content (e.g. "Don't have an account? Sign up") rendered below the form
  className?: string // Optional additional CSS classes to apply to the root container
}

// Shared layout component used by both the login and register pages
export function ModernAuthLayout({ title, description, children, footer, className }: ModernAuthLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-white", className)}> {/* Root container: full viewport height, white background, with optional extra classes merged in */}
      <div className="min-h-screen flex"> {/* Inner flex container that fills the screen and splits into two columns */}
        {/* Left Side - Simple Branding */}
        <div className="hidden lg:flex lg:w-2/5 bg-slate-900 p-12 flex-col items-center justify-center"> {/* Left branding panel: hidden on mobile, 2/5 width on large screens, dark background, centered content */}
          <div className="max-w-md text-center"> {/* Constrain branding content width and center-align text */}
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-12"> {/* Logo row: flex row, centered, with bottom margin */}
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white"> {/* White rounded square container for the shield icon */}
                <Shield className="h-5 w-5 text-slate-900" /> {/* Shield icon in dark color to contrast with white background */}
              </div>
              <div className="text-left"> {/* Text block next to the logo icon */}
                <h2 className="text-lg font-bold text-white">Kalasag-Tala</h2> {/* App name in bold white text */}
                <p className="text-xs text-slate-400">NSTP Command Center</p> {/* Subtitle in muted slate color */}
              </div>
            </div>

            {/* Quote */}
            <div> {/* Container for the inspirational quote and tagline */}
              <p className="text-2xl font-light text-white leading-relaxed mb-8"> {/* Large light-weight quote text in white with relaxed line height */}
                "Empowering the next generation of leaders through service and excellence."
              </p>
              <p className="text-sm text-slate-400"> {/* Smaller tagline text in muted slate color */}
                Streamline your NSTP program with our comprehensive management platform.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-12"> {/* Right form panel: takes remaining space, centers content, with responsive padding */}
          <div className="w-full max-w-md"> {/* Constrain form width to a readable max-width */}
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-3 mb-12"> {/* Mobile-only logo row: visible only below lg breakpoint */}
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900"> {/* Dark rounded square for the mobile logo */}
                <Shield className="h-5 w-5 text-white" /> {/* White shield icon on dark background for mobile */}
              </div>
              <div> {/* Text block next to the mobile logo */}
                <h2 className="text-lg font-bold text-slate-900">Kalasag-Tala</h2> {/* App name in dark text for mobile */}
                <p className="text-xs text-slate-600">NSTP Command Center</p> {/* Subtitle in medium slate for mobile */}
              </div>
            </div>

            {/* Header */}
            <div className="mb-10"> {/* Header section with bottom margin before the form */}
              <h1 className="text-3xl font-bold text-slate-900 mb-3">{title}</h1> {/* Large bold page title passed as prop */}
              <p className="text-slate-600">{description}</p> {/* Subtitle/description text passed as prop */}
            </div>

            {/* Form */}
            {children} {/* Render the login or register form passed as children */}

            {/* Footer */}
            {footer && ( // Only render the footer section if a footer prop was provided
              <div className="mt-8 text-center"> {/* Footer container with top margin and centered text */}
                {footer} {/* Render the footer content (e.g. sign-up link) */}
              </div>
            )}

            {/* Terms */}
            <div className="mt-8 text-center text-xs text-slate-500"> {/* Terms of service notice at the bottom, small and muted */}
              By continuing, you agree to our{" "} {/* Static text before the links */}
              <a href="#" className="text-slate-900 hover:underline">Terms of Service</a> {/* Terms of Service link */}
              {" "}and{" "} {/* Separator text */}
              <a href="#" className="text-slate-900 hover:underline">Privacy Policy</a> {/* Privacy Policy link */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
