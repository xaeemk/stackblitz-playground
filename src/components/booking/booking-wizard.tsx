"use client"

import { useState } from "react"
import { BookingConfirmationStep } from "./booking-confirmation-step"
import { PassengerFormStep, type PassengerData } from "./passenger-form-step"
import { PaymentStep } from "./payment-step"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/formatters"
import { saveFlightBooking } from "@/app/flight-actions"
import type { UserData } from "@/app/page"

interface BookingWizardProps {
  flight: any
  provider: "amadeus" | "duffel"
  userData: UserData | null
  onComplete: () => void
  onBack: () => void
}

export function BookingWizard({ flight, provider, userData, onComplete, onBack }: BookingWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [passenger, setPassenger] = useState<PassengerData | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // CRITICAL FIX: Guard against undefined flight
  if (!flight) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-500 mb-4">No flight selected or flight data is unavailable.</p>
          <Button variant="outline" onClick={onBack}>
            ← Back to Flight Search
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Get price from flight data - with safety checks
  const total = provider === "amadeus" ? flight?.price?.total : flight?.total_amount
  const currency = provider === "amadeus" ? flight?.price?.currency || "USD" : flight?.currency || "USD"

  const handleConfirm = () => setStep(2)

  const handlePassengerSubmit = (data: PassengerData) => {
    setPassenger(data)
    setStep(3)
  }

  const handlePayment = async (method: string) => {
    if (!userData?.userId || !flight || !passenger) {
      setError("Missing required data. Please try again.")
      return
    }

    setIsLoading(true)
    setError(null)
    setPaymentMethod(method)

    try {
      // Format flight data for storage - with safety checks
      const flightData = {
        provider,
        flight: {
          id: provider === "amadeus" ? flight.id || "unknown" : flight.id || "unknown",
          details: {
            airline:
              provider === "amadeus"
                ? flight.validatingAirlineCodes?.[0] || "Multiple Airlines"
                : flight.owner?.name || "Multiple Airlines",
            origin:
              provider === "amadeus"
                ? flight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode || "???"
                : flight.slices?.[0]?.segments?.[0]?.origin?.iata_code ||
                  flight.slices?.[0]?.origin?.iata_code ||
                  "???",
            destination:
              provider === "amadeus"
                ? flight.itineraries?.[0]?.segments?.[0]?.arrival?.iataCode || "???"
                : flight.slices?.[0]?.segments?.[0]?.destination?.iata_code ||
                  flight.slices?.[0]?.destination?.iata_code ||
                  "???",
            departureDate:
              provider === "amadeus"
                ? flight.itineraries?.[0]?.segments?.[0]?.departure?.at
                  ? new Date(flight.itineraries[0].segments[0].departure.at).toLocaleDateString()
                  : "Unknown"
                : flight.slices?.[0]?.segments?.[0]?.departing_at
                  ? new Date(flight.slices[0].segments[0].departing_at).toLocaleDateString()
                  : "Unknown",
            price: formatPrice(total, currency),
          },
        },
        passenger: {
          firstName: passenger.fullName.split(" ")[0],
          lastName: passenger.fullName.split(" ").slice(1).join(" "),
          email: passenger.email,
          phone: passenger.phone,
          dateOfBirth: passenger.dateOfBirth,
          nationality: passenger.nationality,
        },
        payment: {
          method: method,
          amount: total,
          currency: currency,
          timestamp: new Date().toISOString(),
        },
      }

      // Save booking to Redis
      const result = await saveFlightBooking(userData.userId, flightData)

      if (result.success) {
        setStep(4)
      } else {
        setError(result.error || "Failed to confirm booking. Please try again.")
        setPaymentMethod(null)
      }
    } catch (err) {
      setError("An error occurred while processing your payment. Please try again.")
      setPaymentMethod(null)
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Pre-fill passenger form with user data if available
  const defaultPassengerValues = userData
    ? {
        fullName: userData.name,
        email: userData.email,
        phone: userData.phone,
        dateOfBirth: "",
        nationality: "",
      }
    : undefined

  if (step === 4) {
    return (
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="flex justify-center items-center gap-2 text-green-600">
            <CheckCircle className="w-6 h-6" /> Booking Confirmed!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Thank you for your booking!</p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-medium">Booking Details:</p>
            <p>Passenger: {passenger?.fullName || "N/A"}</p>
            <p>Email: {passenger?.email || "N/A"}</p>
            <p>Phone: {passenger?.phone || "N/A"}</p>
            <p>Payment Method: {paymentMethod || "N/A"}</p>
            <p>Amount: {formatPrice(total, currency)}</p>
          </div>
          <p className="text-sm text-gray-500">
            A confirmation email has been sent to {passenger?.email || "your email"}.
          </p>
          <Button onClick={onComplete} className="w-full mt-4">
            Complete Booking
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="text-sm text-gray-500">Step {step} of 3</div>
      </div>

      {step === 1 && (
        <BookingConfirmationStep flight={flight} provider={provider} onConfirm={handleConfirm} onBack={onBack} />
      )}

      {step === 2 && <PassengerFormStep onNext={handlePassengerSubmit} defaultValues={defaultPassengerValues} />}

      {step === 3 && <PaymentStep onPay={handlePayment} amount={total || 0} currency={currency} />}

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}
    </div>
  )
}
