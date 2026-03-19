import { useState } from "react" // Import useState hook for managing local component state (show/hide password)
import { useForm } from "react-hook-form" // Import useForm hook from react-hook-form for form state management and validation
import { z } from "zod" // Import zod for schema-based validation
import { zodResolver } from "@hookform/resolvers/zod" // Import the zod adapter for react-hook-form
import { useMutation } from "@tanstack/react-query" // Import useMutation for handling the async login API call
import { apiRequest } from "../../lib/api" // Import the generic authenticated API request helper
import { setAuthSession } from "../../lib/auth" // Import the function to persist the auth session to localStorage
import { Button } from "../ui/button" // Import the reusable Button component
import { Input } from "../ui/input" // Import the reusable Input component
import { Alert } from "../ui/alert" // Import the Alert component for displaying error messages
import { ModernAuthLayout } from "../layout/ModernAuthLayout" // Import the shared auth page layout (two-column with branding)
import { Link, useNavigate } from "react-router-dom" // Import Link for declarative navigation and useNavigate for programmatic navigation
import { ApiResponse } from "../../types" // Import the generic API response wrapper type
import { toast } from "sonner" // Import the toast function for showing success/error notifications
import { Mail, Lock, Eye, EyeOff, User, Shield, ArrowRight } from "lucide-react" // Import icons (some unused but imported for potential use)

// Zod validation schema for the login form
const schema = z.object({
  email: z.string().min(1, "Email or Student Number is required"), // Email/student number field must not be empty
  password: z.string().min(8, "Password must be at least 8 characters") // Password must be at least 8 characters
})

type FormValues = z.infer<typeof schema> // Derive the TypeScript type from the zod schema

// The modern login page component
export function ModernLoginPage() {
  const navigate = useNavigate() // Hook to programmatically navigate after successful login
  const form = useForm<FormValues>({ // Initialize react-hook-form with zod validation and default empty values
    resolver: zodResolver(schema), // Use the zod schema for validation
    defaultValues: {
      email: "", // Start with an empty email field
      password: "" // Start with an empty password field
    }
  })
  const [showPassword, setShowPassword] = useState(false) // State to toggle password visibility between text and password input type
  
  const mutation = useMutation({ // Set up the login mutation for the POST /api/auth/login endpoint
    mutationFn: (values: FormValues) => // Function that performs the actual API call with the form values
      apiRequest<ApiResponse<{ // Expected response shape from the login endpoint
        user: { 
          id: string; // User's unique ID
          email: string; // User's email address
          role: "ADMIN" | "IMPLEMENTOR" | "CADET_OFFICER" | "STUDENT"; // User's assigned role
          firstName?: string; // Optional first name
          lastName?: string; // Optional last name
          avatarUrl?: string; // Optional avatar URL
          avatarFrame?: string; // Optional avatar frame style
        }; 
        accessToken: string; // JWT access token for API authentication
        refreshToken: string // JWT refresh token for token renewal
      }>>(
        "/api/auth/login", // The login endpoint path
        { method: "POST", body: JSON.stringify(values) } // POST request with the form values as JSON body
      ),
    onSuccess: (response) => { // Callback executed when the login API call succeeds
      if (response.data) { // Check that the response contains user data
        setAuthSession(response.data.user, response.data.accessToken, response.data.refreshToken) // Persist the user, access token, and refresh token to localStorage
        toast.success("Welcome back!") // Show a success toast notification
        navigate("/dashboard") // Redirect the user to the dashboard after successful login
      }
    },
    onError: (error) => { // Callback executed when the login API call fails
      toast.error(error instanceof Error ? error.message : "Login failed") // Show an error toast with the error message or a generic fallback
    }
  })

  const onSubmit = form.handleSubmit(async (values) => { // Create the form submit handler using react-hook-form's handleSubmit (runs validation first)
    await mutation.mutateAsync(values) // Trigger the login mutation with the validated form values
  })

  return (
    <ModernAuthLayout // Use the shared two-column auth layout
      title="Welcome back" // Page title displayed in the right panel header
      description="Sign in to your account to continue" // Subtitle displayed below the title
      footer={ // Footer content rendered below the form
        <Link 
          to="/register" // Navigate to the register page
          className="text-sm text-slate-600 hover:text-slate-900" // Muted text that darkens on hover
        >
          Don't have an account? <span className="font-semibold text-slate-900">Sign up</span> {/* Emphasize the "Sign up" call to action */}
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-6"> {/* Form element with vertical spacing between fields */}
        {mutation.error && ( // Only render the error alert if the mutation has an error
          <Alert variant="danger" className="text-sm"> {/* Red danger alert for login errors */}
            {mutation.error instanceof Error ? mutation.error.message : "Login failed"} {/* Display the error message or a generic fallback */}
          </Alert>
        )}
        
        <div className="space-y-2"> {/* Email field container with small vertical spacing */}
          <label className="text-sm font-medium text-slate-900"> {/* Label for the email/student number input */}
            Email or Student Number
          </label>
          <Input
            {...form.register("email")} // Register the input with react-hook-form for validation and value tracking
            type="text" // Text type to allow both email addresses and student numbers
            placeholder="email@example.com or 2024-12345" // Placeholder showing accepted formats
            className="h-11 border-slate-300 focus:border-slate-900 focus:ring-slate-900" // Taller input with slate border that darkens on focus
            autoComplete="username" // Browser autocomplete hint for username/email
          />
          {form.formState.errors.email && ( // Only render the error message if the email field has a validation error
            <p className="text-xs text-red-600 mt-1"> {/* Small red error text below the input */}
              {form.formState.errors.email.message} {/* Display the zod validation error message */}
            </p>
          )}
        </div>

        <div className="space-y-2"> {/* Password field container with small vertical spacing */}
          <label className="text-sm font-medium text-slate-900"> {/* Label for the password input */}
            Password
          </label>
          <div className="relative"> {/* Relative container to position the show/hide toggle button inside the input */}
            <Input
              {...form.register("password")} // Register the password input with react-hook-form
              type={showPassword ? "text" : "password"} // Toggle between text (visible) and password (hidden) based on state
              placeholder="Enter your password" // Placeholder text for the password field
              className="h-11 pr-10 border-slate-300 focus:border-slate-900 focus:ring-slate-900" // Taller input with right padding for the toggle button
              autoComplete="current-password" // Browser autocomplete hint for the current password
            />
            <button
              type="button" // Prevent this button from submitting the form
              onClick={() => setShowPassword(!showPassword)} // Toggle the showPassword state on click
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" // Position the button vertically centered on the right side of the input
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {/* Show EyeOff when password is visible, Eye when hidden */}
            </button>
          </div>
          {form.formState.errors.password && ( // Only render the error message if the password field has a validation error
            <p className="text-xs text-red-600 mt-1"> {/* Small red error text below the input */}
              {form.formState.errors.password.message} {/* Display the zod validation error message */}
            </p>
          )}
        </div>

        <Button
          type="submit" // This button submits the form
          className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white" // Full-width tall dark button
          disabled={mutation.isPending} // Disable the button while the login request is in progress
        >
          {mutation.isPending ? ( // Show a loading spinner and text while the request is pending
            <span className="flex items-center gap-2"> {/* Flex row for spinner and text */}
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {/* CSS spinner: circular border with transparent top segment that spins */}
              Signing in...
            </span>
          ) : (
            "Sign in" // Default button text when not loading
          )}
        </Button>

        {/* Demo Accounts */}
        <div className="pt-6 border-t border-slate-200"> {/* Section separator with top padding and border */}
          <p className="text-xs text-slate-500 mb-3">Demo accounts for testing:</p> {/* Section label */}
          <div className="space-y-2"> {/* Vertical stack of demo account buttons */}
            <button
              type="button" // Prevent form submission
              onClick={() => { // Fill in the admin demo credentials on click
                form.setValue("email", "admin@nstp.local") // Set the email field to the admin demo email
                form.setValue("password", "Password123!") // Set the password field to the demo password
              }}
              className="w-full text-left px-4 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors" // Full-width left-aligned button with hover background
            >
              <div className="flex items-center justify-between"> {/* Row with text on left and arrow on right */}
                <div> {/* Text content block */}
                  <p className="text-sm font-medium text-slate-900">Admin Account</p> {/* Account type label */}
                  <p className="text-xs text-slate-500">admin@nstp.local</p> {/* Demo email address */}
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" /> {/* Right arrow icon indicating this is clickable */}
              </div>
            </button>
            <button
              type="button" // Prevent form submission
              onClick={() => { // Fill in the student demo credentials on click
                form.setValue("email", "student@nstp.local") // Set the email field to the student demo email
                form.setValue("password", "Password123!") // Set the password field to the demo password
              }}
              className="w-full text-left px-4 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors" // Full-width left-aligned button with hover background
            >
              <div className="flex items-center justify-between"> {/* Row with text on left and arrow on right */}
                <div> {/* Text content block */}
                  <p className="text-sm font-medium text-slate-900">Student Account</p> {/* Account type label */}
                  <p className="text-xs text-slate-500">student@nstp.local</p> {/* Demo email address */}
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" /> {/* Right arrow icon */}
              </div>
            </button>
          </div>
        </div>
      </form>
    </ModernAuthLayout>
  )
}
