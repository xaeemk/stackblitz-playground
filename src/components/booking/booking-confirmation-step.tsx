"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatFlightDetails, formatPrice } from "@/lib/formatters"

interface BookingConfirmationStepProps {
  flight: any
  provider: "amadeus" | "duffel"
  onConfirm: () => void
  onBack: () => void
}

export function BookingConfirmationStep({ flight, provider, onConfirm, onBack }: BookingConfirmationStepProps) {
  // Guard against undefined flight
  if (!flight) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Flight Selection Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-red-500">No flight selected or flight data is unavailable.</p>
          <Button variant="outline" onClick={onBack}>
            ← Back to Flight Search
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Safely extract origin and destination
  let origin = "Origin"
  let destination = "Destination"

  if (provider === "amadeus") {
    const firstSegment = flight?.itineraries?.[0]?.segments?.[0]
    if (firstSegment) {
      origin = firstSegment?.departure?.iataCode || "Origin"
      destination = firstSegment?.arrival?.iataCode || "Destination"
    }
  } else {
    // Duffel
    const firstSlice = flight?.slices?.[0]
    if (firstSlice) {
      origin = firstSlice?.origin?.iata_code || firstSlice?.segments?.[0]?.origin?.iata_code || "Origin"
      destination =
        firstSlice?.destination?.iata_code || firstSlice?.segments?.[0]?.destination?.iata_code || "Destination"
    }
  }

  // Safely extract price
  const total = provider === "amadeus" ? flight?.price?.total : flight?.total_amount
  const currency = provider === "amadeus" ? flight?.price?.currency || "USD" : flight?.currency || "USD"

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirm Your Flight</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>
          You&apos;ve selected a flight from <strong>{origin}</strong> to <strong>{destination}</strong>
        </p>

        <p className="text-sm text-gray-600">{formatFlightDetails(flight, provider)}</p>

        <p>
          Total fare: <span className="font-bold text-blue-600">{formatPrice(total, currency)}</span>
        </p>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={onConfirm}>
            Confirm & Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
