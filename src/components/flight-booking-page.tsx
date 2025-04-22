import { useState } from "react"
import { FlightSearchForm } from "./flight-search-form"
import { FlightResults } from "./flight-results"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, CalendarCheck, Search, Clock } from "lucide-react"
import { CheckCircle2 } from "lucide-react"
import { FlightStatusTracker } from "./flight-status-tracker"
import type { UserData } from "@/app/page"
// Import the new BookingWizard component
import { BookingWizard } from "./booking/booking-wizard"

interface FlightBookingPageProps {
  userData: UserData | null
  onComplete: () => void
}

export function FlightBookingPage({ userData, onComplete }: FlightBookingPageProps) {
  const [activeTab, setActiveTab] = useState<"search" | "status">("search")
  const [step, setStep] = useState<"search" | "select" | "confirm" | "complete">("search")
  const [searchResults, setSearchResults] = useState<any>(null)
  const [selectedFlight, setSelectedFlight] = useState<any>(null)
  const [provider, setProvider] = useState<"amadeus" | "duffel" | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookingConfirmed, setBookingConfirmed] = useState(false)

  const handleSearchResults = (results: any) => {
    setSearchResults(results)
    setStep("select")
  }

  const handleSelectFlight = (flight: any, provider: string) => {
    // CRITICAL FIX: Validate flight data before setting it
    if (!flight) {
      setError("Invalid flight data selected. Please try again.")
      return
    }

    setSelectedFlight(flight)
    setProvider(provider as "amadeus" | "duffel")
    setStep("confirm")
  }

  const handleBackToSearch = () => {
    setStep("search")
  }

  const handleBackToResults = () => {
    setStep("select")
  }

  // Replace the existing handleConfirmBooking function with this:
  const handleConfirmBooking = () => {
    // CRITICAL FIX: Validate flight data before proceeding
    if (!selectedFlight) {
      setError("No flight selected. Please go back and select a flight.")
      return
    }

    setStep("confirm")
  }

  // Format price
  const formatPrice = (price: string) => {
    if (!price) return "N/A"
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(Number.parseFloat(price))
    } catch (error) {
      console.error("Error formatting price:", error)
      return price
    }
  }

  // Replace the existing renderFlightDetails, renderPassengerDetails, renderPaymentDetails, and renderBookingConfirmation functions with this:
  const renderBookingWizard = () => {
    // CRITICAL FIX: Validate flight data before rendering the wizard
    if (!selectedFlight || !provider) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
          <p className="text-red-600 font-medium mb-4">No flight selected or flight data is unavailable.</p>
          <Button variant="outline" onClick={handleBackToSearch}>
            ← Back to Flight Search
          </Button>
        </div>
      )
    }

    return (
      <BookingWizard
        flight={selectedFlight}
        provider={provider}
        userData={userData}
        onComplete={() => {
          setBookingConfirmed(true)
          setStep("complete")
        }}
        onBack={handleBackToResults}
      />
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
          <Button variant="link" className="p-0 h-auto text-sm ml-2" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {step === "search" && (
        <>
          <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as "search" | "status")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search Flights
              </TabsTrigger>
              <TabsTrigger value="status" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Flight Status
              </TabsTrigger>
            </TabsList>
            <TabsContent value="search">
              <FlightSearchForm onSearchResults={handleSearchResults} />
            </TabsContent>
            <TabsContent value="status">
              <FlightStatusTracker />
            </TabsContent>
          </Tabs>
        </>
      )}

      {step === "select" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleBackToSearch} className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to Search
            </Button>
            <h2 className="text-xl font-bold">Select Your Flight</h2>
          </div>
          <FlightResults searchResults={searchResults} onSelectFlight={handleSelectFlight} />
        </div>
      )}

      {/* Replace the "confirm" step rendering in the return statement with: */}
      {step === "confirm" && renderBookingWizard()}

      {step === "complete" && (
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-xl font-semibold">Booking Confirmed!</h3>
            <p className="text-gray-500 mt-1">Your flight has been successfully booked.</p>
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="bg-blue-50 py-3">
              <CardTitle className="text-lg">Flight Details</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {/* CRITICAL FIX: Safely display flight details */}
              {selectedFlight ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Route:</span>
                    <span className="font-medium">
                      {provider === "amadeus"
                        ? `${selectedFlight?.itineraries?.[0]?.segments?.[0]?.departure?.iataCode || "???"} → ${
                            selectedFlight?.itineraries?.[0]?.segments?.slice(-1)[0]?.arrival?.iataCode || "???"
                          }`
                        : `${selectedFlight?.slices?.[0]?.origin?.iata_code || "???"} → ${
                            selectedFlight?.slices?.[0]?.destination?.iata_code || "???"
                          }`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date:</span>
                    <span className="font-medium">
                      {provider === "amadeus" && selectedFlight?.itineraries?.[0]?.segments?.[0]?.departure?.at
                        ? new Date(selectedFlight.itineraries[0].segments[0].departure.at).toLocaleDateString()
                        : provider === "duffel" && selectedFlight?.slices?.[0]?.segments?.[0]?.departing_at
                          ? new Date(selectedFlight.slices[0].segments[0].departing_at).toLocaleDateString()
                          : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Price:</span>
                    <span className="font-medium text-green-700">
                      {provider === "amadeus"
                        ? formatPrice(selectedFlight?.price?.total || "0")
                        : formatPrice(selectedFlight?.total_amount || "0")}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center">Flight details unavailable</p>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="bg-blue-50 py-3">
              <CardTitle className="text-lg">Passenger Information</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Name:</span>
                  <span className="font-medium">{userData?.name || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email:</span>
                  <span className="font-medium">{userData?.email || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone:</span>
                  <span className="font-medium">{userData?.phone || "N/A"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-3">
              <CalendarCheck className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Important Information</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  A confirmation email has been sent to {userData?.email || "your email"}. Please check your email for
                  your e-ticket and booking details.
                </p>
              </div>
            </div>
          </div>

          <Button onClick={onComplete} className="w-full">
            Complete Booking
          </Button>
        </div>
      )}
    </div>
  )
}
