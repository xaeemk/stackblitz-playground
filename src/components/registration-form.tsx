"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import type { UserData } from "@/app/page"
import { registerUser } from "@/app/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"

// Define the form schema
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(10, { message: "Please enter a valid phone number." }),
})

// Define the form values type
type FormValues = z.infer<typeof formSchema>

interface RegistrationFormProps {
  onSubmit: (data: UserData) => void
  onPhoneSearch?: (phone: string) => Promise<boolean>
}

export function RegistrationForm({ onSubmit, onPhoneSearch }: RegistrationFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  })

  // Handle form submission
  const handleSubmit = async (values: FormValues) => {
    setIsLoading(true)
    setError("")

    try {
      // Register user in Redis
      const { userId } = await registerUser(values)

      // Submit the form with userId included
      onSubmit({
        ...values,
        userId,
      })
    } catch (err) {
      setError("Failed to register. Please try again.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle phone number blur event
  const handlePhoneBlur = async () => {
    const phone = form.getValues("phone")
    if (phone.length >= 10 && onPhoneSearch) {
      setIsSearching(true)
      try {
        const found = await onPhoneSearch(phone)
        if (found) {
          form.setValue("name", "Existing User")
          form.setValue("email", "user@example.com")
        }
      } catch (error) {
        console.error("Error searching for user:", error)
      } finally {
        setIsSearching(false)
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    placeholder="+1 (555) 123-4567"
                    {...field}
                    onBlur={() => {
                      field.onBlur()
                      handlePhoneBlur()
                    }}
                  />
                  {isSearching && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Processing..." : "Register"}
        </Button>
      </form>
    </Form>
  )
}
