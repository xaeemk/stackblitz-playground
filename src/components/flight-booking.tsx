"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CreditCard, User, Mail, Phone, Calendar, Flag, Plane, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { saveFlightBooking } from "@/app/flight-actions"
import type { UserData } from "@/app/page"

const formSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(10, { message: "Please enter a valid phone number." }),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Please enter a valid date (YYYY-MM-DD)." }),
  nationality: z.string().min(2, { message: "Please enter your nationality." }),
  cardNumber: z.string().regex(/^\d{16}$/, { message: "Please enter a valid 16-digit card number." }),
  cardExpiry: z.string().regex(/^\d{2}\\/\\d{2}$/, { message: "Please enter a valid expiry date (MM/YY)." }),
  cardCvc: z.string().regex(/^\d{3,4}$/, { message: "Please enter a valid CVC code." }),
})

interface FlightBookingProps {
  selectedFlight: any
  provider: string
  userData: UserData | null
  onBookingComplete: () => void
}

export function FlightBooking({ selectedFlight, provider, userData, onBookingComplete }: FlightBookingProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: userData?.name?.split(" ")[0] || "",
      lastName: userData?.name?.split(" ").slice(1).join(" ") || "",
      email: userData?.email || "",
      phone: userData?.phone || "",
      dateOfBirth: "",
      nationality: "",
      cardNumber: "",
      cardExpiry: "",
      cardCvc: "",
    },
  })

  // CRITICAL FIX: Guard against undefined selectedFlight
  if (!selectedFlight) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
        <p className="text-red-600 font-medium mb-4">No flight selected or flight data is unavailable.</p>
        <Button variant="outline" onClick={() => window.history.back()}>
          ← Back to Flight Search
        </Button>
      </div>
    )
  }

  // Format flight details for display - with safety checks
  const formatFlightDetailsForDisplay = () => {
    try {
      if (provider === "amadeus") {
        const itineraries = selectedFlight.itineraries || []
        if (itineraries.length === 0)
          return {
            airline: "Unknown",
            origin: "",
            destination: "",
            departureDate: "",
            returnDate: "",
            price: "",
            passengers: 1,
          }

        const firstSegment = itineraries[0]?.segments?.[0]
        if (!firstSegment)
          return {
            airline: "Unknown",
            origin: "",
            destination: "",
            departureDate: "",
            returnDate: "",
            price: "",
            passengers: 1,
          }

        const lastSegment = itineraries[itineraries.length - 1]?.segments?.slice(-1)[0]
        if (!lastSegment)
          return {
            airline: "Unknown",
            origin: "",
            destination: "",
            departureDate: "",
            returnDate: "",
            price: "",
            passengers: 1,
          }

        return {
          airline: selectedFlight.validatingAirlineCodes?.[0] || "Multiple Airlines",
          origin: firstSegment?.departure?.iataCode || "",
          destination: lastSegment?.arrival?.iataCode || "",
          departureDate: firstSegment?.departure?.at ? format(new Date(firstSegment.departure.at), "PPP") : "",
          returnDate:
            itineraries.length > 1 && itineraries[1]?.segments?.[0]?.departure?.at
              ? format(new Date(itineraries[1].segments[0].departure.at), "PPP")
              : "",
          price: selectedFlight.price?.total ? `${selectedFlight.price.total}` : "",
          passengers: selectedFlight.travelerPricings?.length || 1,
        }
      } else {
        // Duffel
        const slices = selectedFlight.slices || []
        if (slices.length === 0)
          return {
            airline: "Unknown",
            origin: "",
            destination: "",
            departureDate: "",
            returnDate: "",
            price: "",
            passengers: 1,
          }

        const firstSegment = slices[0]?.segments?.[0]
        if (!firstSegment)
          return {
            airline: "Unknown",
            origin: "",
            destination: "",
            departureDate: "",
            returnDate: "",
            price: "",
            passengers: 1,
          }

        const lastSegment = slices[slices.length - 1]?.segments?.slice(-1)[0]
        if (!lastSegment)
          return {
            airline: "Unknown",
            origin: "",
            destination: "",
            departureDate: "",
            returnDate: "",
            price: "",
            passengers: 1,
          }

        return {
          airline: selectedFlight.owner?.name || "Multiple Airlines",
          origin: firstSegment?.origin?.iata_code || slices[0]?.origin?.iata_code || "",
          destination: lastSegment?.destination?.iata_code || slices[slices.length - 1]?.destination?.iata_code || "",
          departureDate: firstSegment?.departing_at ? format(new Date(firstSegment.departing_at), "PPP") : "",
          returnDate:
            slices.length > 1 && slices[1]?.segments?.[0]?.departing_at
              ? format(new Date(slices[1].segments[0].departing_at), "PPP")
              : "",
          price: selectedFlight.total_amount ? `${selectedFlight.total_amount}` : "",
          passengers: selectedFlight.passengers_count || 1,
        }
      }
    } catch (error) {
      console.error("Error formatting flight details:", error)
      return {
        airline: "Unknown",
        origin: "",
        destination: "",
        departureDate: "",
        returnDate: "",
        price: "",
        passengers: 1,
      }
    }
  }

  const flightDetails = formatFlightDetailsForDisplay()

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)

    try {
      // Prepare booking data
      const bookingData = {
        passenger: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
          dateOfBirth: values.dateOfBirth,
          nationality: values.nationality,
        },
        flight: {
          provider,
          details: flightDetails,
          rawData: selectedFlight,
        },
        payment: {
          cardNumber: values.cardNumber.slice(-4), // Only store last 4 digits for security
          cardExpiry: values.cardExpiry,
        },
        bookingDate: new Date().toISOString(),
      }

      // Save booking
      const result = await saveFlightBooking(userData?.userId || "", bookingData)

      if (result.success) {
        setIsSuccess(true)
        setTimeout(() => {
          onBookingComplete()
        }, 2000)
      } else {
        setError(result.error || "Failed to complete booking. Please try again.")
      }
    } catch (err) {
      setError("An error occurred while processing your booking. Please try again.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-green-700 mb-2">Booking Confirmed!</h2>
        <p className="text-gray-600 mb-6">Your flight has been successfully booked.</p>
        <div className="bg-gray-50 p-4 rounded-lg w-full max-w-md">
          <div className="flex justify-between mb-2">
            <span className="text-gray-500">Booking Reference:</span>
            <span className="font-semibold">{Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-500">Flight:</span>
            <span className="font-semibold">
              {flightDetails.origin} to {flightDetails.destination}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Date:</span>
            <span className="font-semibold">{flightDetails.departureDate}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-blue-50">
          <CardTitle className="text-xl text-blue-800">Flight Details</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Airline</p>
              <p className="font-medium">{flightDetails.airline}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Route</p>
              <p className="font-medium">
                {flightDetails.origin} → {flightDetails.destination}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Departure Date</p>
              <p className="font-medium">{flightDetails.departureDate}</p>
            </div>
            {flightDetails.returnDate && (
              <div>
                <p className="text-sm text-gray-500">Return Date</p>
                <p className="font-medium">{flightDetails.returnDate}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Price</p>
              <p className="font-medium text-green-700">{flightDetails.price}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Passengers</p>
              <p className="font-medium">{flightDetails.passengers}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Passenger Information</CardTitle>
              <CardDescription>Please enter the passenger details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        First Name
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Last Name
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Number
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Date of Birth
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="YYYY-MM-DD" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Flag className="h-4 w-4" />
                        Nationality
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. US" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Payment Information</CardTitle>
              <CardDescription>Please enter your payment details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="cardNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Card Number
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="1234 5678 9012 3456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cardExpiry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <FormControl>
                        <Input placeholder="MM/YY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cardCvc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CVC</FormLabel>
                      <FormControl>
                        <Input placeholder="123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col">
              <Separator className="mb-4" />
              <div className="flex justify-between w-full mb-4">
                <span className="text-lg font-medium">Total Price:</span>
                <span className="text-lg font-bold text-green-700">{flightDetails.price}</span>
              </div>

              {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4 w-full">{error}</div>}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing Payment...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Plane className="h-5 w-5" />
                    Confirm and Pay
                  </span>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  )
}
