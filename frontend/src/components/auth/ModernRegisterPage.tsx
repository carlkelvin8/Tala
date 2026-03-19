import { useState } from "react" // Import useState for managing local state (show/hide password, password strength tracking)
import { useForm } from "react-hook-form" // Import useForm for form state management and validation
import { z } from "zod" // Import zod for schema-based validation
import { zodResolver } from "@hookform/resolvers/zod" // Import the zod adapter for react-hook-form
import { useMutation } from "@tanstack/react-query" // Import useMutation for handling the async registration API call
import { apiRequest } from "../../lib/api" // Import the generic API request helper
import { Button } from "../ui/button" // Import the reusable Button component
import { Input } from "../ui/input" // Import the reusable Input component
import { Alert } from "../ui/alert" // Import the Alert component for displaying error messages
import { ModernAuthLayout } from "../layout/ModernAuthLayout" // Import the shared two-column auth layout
import { Link, useNavigate } from "react-router-dom" // Import Link for navigation and useNavigate for programmatic redirect
import { ApiResponse } from "../../types" // Import the generic API response wrapper type
import { toast } from "sonner" // Import toast for showing notifications
import { User as UserIcon, Mail, Lock, Eye, EyeOff, Shield, ArrowRight, CheckCircle2 } from "lucide-react" // Import icons (some unused but available)
import { PasswordStrength } from "./PasswordStrength" // Import the password strength indicator component

// Zod validation schema for the registration form with strong password requirements
const schema = z.object({
  firstName: z.string().min(1, "First name is required"), // First name must not be empty
  lastName: z.string().min(1, "Last name is required"), // Last name must not be empty
  studentNo: z.string().min(1, "Student number is required"), // Student number must not be empty
  email: z.string().email("Please enter a valid email address"), // Must be a valid email format
  password: z.string()
    .min(8, "Password must be at least 8 characters") // Minimum 8 characters
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter") // Must have at least one uppercase letter
    .regex(/[a-z]/, "Password must contain at least one lowercase letter") // Must have at least one lowercase letter
    .regex(/\d/, "Password must contain at least one number") // Must have at least one digit
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character") // Must have at least one special character
})

type FormValues = z.infer<typeof schema> // Derive the TypeScript type from the zod schema

const DEFAULT_ROLE = "STUDENT" // All self-registered users are assigned the STUDENT role by default

// The modern registration page component
export function ModernRegisterPage() {
  const navigate = useNavigate() // Hook for programmatic navigation after successful registration
  const [showPassword, setShowPassword] = useState(false) // State to toggle password visibility
  const [password, setPassword] = useState("") // State to track the current password value for the strength indicator
  
  const form = useForm<FormValues>({ // Initialize react-hook-form with zod validation and empty default values
    resolver: zodResolver(schema), // Use the zod schema for validation
    defaultValues: {
      firstName: "", // Start with empty first name
      lastName: "", // Start with empty last name
      studentNo: "", // Start with empty student number
      email: "", // Start with empty email
      password: "" // Start with empty password
    }
  })
  
  const mutation = useMutation({ // Set up the registration mutation for the POST /api/auth/register endpoint
    mutationFn: (values: FormValues) => // Function that performs the actual API call
      apiRequest<ApiResponse<{ id: string }>>("/api/auth/register", { // Expected response contains the new user's ID
        method: "POST", // HTTP POST method for creating a new resource
        body: JSON.stringify({ ...values, role: DEFAULT_ROLE }) // Include all form values plus the hardcoded STUDENT role
      }),
    onError: (error) => { // Callback executed when the registration API call fails
      toast.error(error instanceof Error ? error.message : "Registration failed") // Show an error toast with the error message
    }
  })

  const onSubmit = form.handleSubmit(async (values) => { // Create the form submit handler (runs validation first)
    await mutation.mutateAsync(values) // Trigger the registration mutation with the validated form values
    toast.success("Account created successfully! Please sign in.") // Show a success notification
    navigate("/login") // Redirect to the login page after successful registration
  })

  return (
    <ModernAuthLayout // Use the shared two-column auth layout
      title="Create your account" // Page title for the registration form
      description="Join the NSTP Command Center" // Subtitle for the registration form
      footer={ // Footer content with a link back to the login page
        <Link 
          to="/login" // Navigate to the login page
          className="text-sm text-slate-600 hover:text-slate-900" // Muted text that darkens on hover
        >
          Already have an account? <span className="font-semibold text-slate-900">Sign in</span> {/* Emphasize the "Sign in" call to action */}
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5"> {/* Form with vertical spacing between fields */}
        {mutation.isError && ( // Only render the error alert if the mutation has an error
          <Alert variant="danger" className="text-sm"> {/* Red danger alert for registration errors */}
            {(mutation.error as Error).message} {/* Display the error message from the API */}
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4"> {/* Two-column grid for first and last name fields */}
          <div className="space-y-2"> {/* First name field container */}
            <label htmlFor="firstName" className="text-sm font-medium text-slate-900"> {/* Label linked to the firstName input */}
              First Name
            </label>
            <Input
              id="firstName" // ID matching the label's htmlFor for accessibility
              placeholder="Juan" // Example first name placeholder
              className="h-11 border-slate-300 focus:border-slate-900 focus:ring-slate-900" // Taller input with slate border
              autoComplete="given-name" // Browser autocomplete hint for given name
              {...form.register("firstName")} // Register with react-hook-form
            />
            {form.formState.errors.firstName && ( // Only render if there's a validation error
              <p className="text-xs text-red-600 mt-1"> {/* Small red error text */}
                {form.formState.errors.firstName.message} {/* Zod validation error message */}
              </p>
            )}
          </div>

          <div className="space-y-2"> {/* Last name field container */}
            <label htmlFor="lastName" className="text-sm font-medium text-slate-900"> {/* Label linked to the lastName input */}
              Last Name
            </label>
            <Input
              id="lastName" // ID matching the label's htmlFor for accessibility
              placeholder="Dela Cruz" // Example last name placeholder
              className="h-11 border-slate-300 focus:border-slate-900 focus:ring-slate-900" // Taller input with slate border
              autoComplete="family-name" // Browser autocomplete hint for family name
              {...form.register("lastName")} // Register with react-hook-form
            />
            {form.formState.errors.lastName && ( // Only render if there's a validation error
              <p className="text-xs text-red-600 mt-1"> {/* Small red error text */}
                {form.formState.errors.lastName.message} {/* Zod validation error message */}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2"> {/* Student number field container */}
          <label htmlFor="studentNo" className="text-sm font-medium text-slate-900"> {/* Label for the student number input */}
            Student Number
          </label>
          <Input
            id="studentNo" // ID for accessibility
            placeholder="2024-12345" // Example student number format
            className="h-11 border-slate-300 focus:border-slate-900 focus:ring-slate-900" // Taller input with slate border
            autoComplete="off" // Disable browser autocomplete for student number
            {...form.register("studentNo")} // Register with react-hook-form
          />
          {form.formState.errors.studentNo && ( // Only render if there's a validation error
            <p className="text-xs text-red-600 mt-1"> {/* Small red error text */}
              {form.formState.errors.studentNo.message} {/* Zod validation error message */}
            </p>
          )}
        </div>

        <div className="space-y-2"> {/* Email field container */}
          <label htmlFor="email" className="text-sm font-medium text-slate-900"> {/* Label for the email input */}
            Email Address
          </label>
          <Input
            id="email" // ID for accessibility
            type="email" // Email input type for browser validation and keyboard hints on mobile
            placeholder="your.email@example.com" // Example email placeholder
            className="h-11 border-slate-300 focus:border-slate-900 focus:ring-slate-900" // Taller input with slate border
            autoComplete="email" // Browser autocomplete hint for email
            {...form.register("email")} // Register with react-hook-form
          />
          {form.formState.errors.email && ( // Only render if there's a validation error
            <p className="text-xs text-red-600 mt-1"> {/* Small red error text */}
              {form.formState.errors.email.message} {/* Zod validation error message */}
            </p>
          )}
        </div>

        <div className="space-y-2"> {/* Password field container */}
          <label htmlFor="password" className="text-sm font-medium text-slate-900"> {/* Label for the password input */}
            Password
          </label>
          <div className="relative"> {/* Relative container to position the show/hide toggle inside the input */}
            <Input
              id="password" // ID for accessibility
              type={showPassword ? "text" : "password"} // Toggle between visible text and hidden password
              placeholder="Create a strong password" // Placeholder encouraging a strong password
              className="h-11 pr-10 border-slate-300 focus:border-slate-900 focus:ring-slate-900" // Taller input with right padding for the toggle button
              autoComplete="new-password" // Browser autocomplete hint for new password (prevents autofill of existing passwords)
              {...form.register("password", {
                onChange: (e) => setPassword(e.target.value) // Update the local password state on every keystroke for the strength indicator
              })}
            />
            <button
              type="button" // Prevent form submission
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" // Position toggle button vertically centered on the right
              onClick={() => setShowPassword(!showPassword)} // Toggle password visibility on click
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {/* Show EyeOff when visible, Eye when hidden */}
            </button>
          </div>
          <PasswordStrength password={password} /> {/* Render the password strength indicator, passing the current password value */}
          {form.formState.errors.password && ( // Only render if there's a validation error
            <p className="text-xs text-red-600 mt-1"> {/* Small red error text */}
              {form.formState.errors.password.message} {/* Zod validation error message */}
            </p>
          )}
        </div>

        <Button 
          type="submit" // This button submits the form
          className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white" // Full-width tall dark button
          disabled={mutation.isPending} // Disable while the registration request is in progress
        >
          {mutation.isPending ? ( // Show loading state while the request is pending
            <span className="flex items-center gap-2"> {/* Flex row for spinner and text */}
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {/* CSS spinner */}
              Creating account...
            </span>
          ) : (
            "Create account" // Default button text
          )}
        </Button>

        <div className="pt-5 border-t border-slate-200"> {/* Password requirements notice with top border separator */}
          <p className="text-xs text-slate-500"> {/* Small muted text explaining password requirements */}
            Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.
          </p>
        </div>
      </form>
    </ModernAuthLayout>
  )
}
