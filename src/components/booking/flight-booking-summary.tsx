import { formatFlightDetails, formatPrice } from "@/lib/formatters"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface FlightBookingSummaryProps {
  selectedFlight: any
  provider: "amadeus" | "duffel"
  onBack?: () => void
}

export function FlightBookingSummary({ selectedFlight, provider, onBack }: FlightBookingSummaryProps) {
  if (!selectedFlight) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-6 text-center">
          <p className="text-red-500">No flight selected. Please go back and choose one.</p>
          {onBack && (
            <Button variant="outline" onClick={onBack} className="mt-4">
              ← Back to Flight Search
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  // Safely extract data
  const total = provider === "amadeus" ? selectedFlight?.price?.total : selectedFlight?.total_amount
  const currency = provider === "amadeus" ? selectedFlight?.price?.currency || "USD" : selectedFlight?.currency || "USD"
  const airline =
    provider === "amadeus"
      ? selectedFlight?.validatingAirlineCodes?.[0] || "Multiple Airlines"
      : selectedFlight?.owner?.name || "Multiple Airlines"

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row justify-between items-center bg-blue-50">
        <CardTitle className="text-xl font-semibold">Flight Summary</CardTitle>
        <Badge variant="outline">{provider.toUpperCase()}</Badge>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <div className="text-gray-700">
          <p className="text-sm text-gray-500 mb-1">Airline</p>
          <p className="font-medium">{airline}</p>
        </div>

        <div className="text-gray-700">
          <p className="text-sm text-gray-500 mb-1">Route & Time</p>
          <p className="font-medium">{formatFlightDetails(selectedFlight, provider)}</p>
        </div>

        <div className="text-gray-700">
          <p className="text-sm text-gray-500 mb-1">Total Price</p>
          <p className="font-bold text-lg text-blue-700">{formatPrice(total, currency)}</p>
        </div>

        {onBack && (
          <Button variant="outline" onClick={onBack} className="mt-2">
            ← Back to Results
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
