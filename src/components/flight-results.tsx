"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FlightCard } from "./flight-card"
import { Loader2, SortAsc } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Helper function to format flight details
export const formatFlightDetails = (flightData: any, provider: string) => {
  if (!flightData) return "Flight details unavailable."

  try {
    if (provider === "amadeus") {
      const itineraries = flightData?.itineraries
      if (!itineraries || !Array.isArray(itineraries) || itineraries.length === 0) {
        return "Flight details unavailable."
      }

      return itineraries
        .map((itinerary: any, index: number) => {
          const segments = itinerary?.segments || []
          if (segments.length === 0) return "No segments"

          const firstSegment = segments[0]
          const lastSegment = segments[segments.length - 1]

          const origin = firstSegment?.departure?.iataCode || "???"
          const destination = lastSegment?.arrival?.iataCode || "???"
          const departure = firstSegment?.departure?.at
            ? new Date(firstSegment.departure.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "N/A"

          return `${index === 0 ? "Outbound" : "Return"}: ${origin} → ${destination} (${departure})`
        })
        .join(", ")
    } else {
      // Duffel
      const slices = flightData?.slices
      if (!slices || !Array.isArray(slices) || slices.length === 0) {
        return "Flight details unavailable."
      }

      return slices
        .map((slice: any, index: number) => {
          const segments = slice?.segments || []
          if (segments.length === 0) return "No segments"

          const firstSegment = segments[0]
          const lastSegment = segments[segments.length - 1]

          const origin = firstSegment?.origin?.iata_code || "???"
          const destination = lastSegment?.destination?.iata_code || "???"
          const departure = firstSegment?.departing_at
            ? new Date(firstSegment.departing_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "N/A"

          return `${index === 0 ? "Outbound" : "Return"}: ${origin} → ${destination} (${departure})`
        })
        .join(", ")
    }
  } catch (error) {
    console.error("Error formatting flight details:", error)
    return "Error formatting flight details."
  }
}

interface FlightResultsProps {
  searchResults: any
  onSelectFlight: (flight: any, provider: string) => void
  isLoading?: boolean
}

export function FlightResults({ searchResults, onSelectFlight, isLoading = false }: FlightResultsProps) {
  const [activeTab, setActiveTab] = useState("amadeus")
  const [sortBy, setSortBy] = useState<"price" | "duration" | "departure">("price")

  const amadeusFlights = searchResults?.amadeus?.data || []
  const duffelFlights = searchResults?.duffel?.data?.offers || []

  const hasAmadeusResults = amadeusFlights.length > 0
  const hasDuffelResults = duffelFlights.length > 0
  const hasNoResults = !hasAmadeusResults && !hasDuffelResults

  // Helper functions for sorting
  const getPrice = (flight: any, provider: string) => {
    if (provider === "amadeus") {
      return flight?.price?.total ? Number.parseFloat(flight.price.total) : 999999
    } else {
      return flight?.total_amount ? Number.parseFloat(flight.total_amount) : 999999
    }
  }

  const getDuration = (flight: any, provider: string) => {
    try {
      if (provider === "amadeus") {
        const duration = flight?.itineraries?.[0]?.duration
        if (!duration) return 9999

        // Parse PT2H30M format to minutes
        const hourMatch = duration.match(/(\d+)H/)
        const minuteMatch = duration.match(/(\d+)M/)

        const hours = hourMatch ? Number.parseInt(hourMatch[1]) : 0
        const minutes = minuteMatch ? Number.parseInt(minuteMatch[1]) : 0

        return hours * 60 + minutes
      } else {
        // Duffel
        const duration = flight?.slices?.[0]?.duration
        if (!duration) return 9999

        // Parse PT2H30M format to minutes
        const hourMatch = duration.match(/(\d+)H/)
        const minuteMatch = duration.match(/(\d+)M/)

        const hours = hourMatch ? Number.parseInt(hourMatch[1]) : 0
        const minutes = minuteMatch ? Number.parseInt(minuteMatch[1]) : 0

        return hours * 60 + minutes
      }
    } catch (error) {
      console.error("Error parsing duration:", error)
      return 9999
    }
  }

  const getDepartureTime = (flight: any, provider: string) => {
    try {
      const departureTimeStr =
        provider === "amadeus"
          ? flight?.itineraries?.[0]?.segments?.[0]?.departure?.at
          : flight?.slices?.[0]?.segments?.[0]?.departing_at

      if (!departureTimeStr) return Number.POSITIVE_INFINITY

      return new Date(departureTimeStr).getTime()
    } catch (error) {
      console.error("Error getting departure time:", error)
      return Number.POSITIVE_INFINITY
    }
  }

  const sortFlights = (flights: any[], provider: "amadeus" | "duffel") => {
    if (!flights || !Array.isArray(flights)) return []

    return [...flights].sort((a, b) => {
      if (sortBy === "price") return getPrice(a, provider) - getPrice(b, provider)
      if (sortBy === "duration") return getDuration(a, provider) - getDuration(b, provider)
      if (sortBy === "departure") return getDepartureTime(a, provider) - getDepartureTime(b, provider)
      return 0
    })
  }

  const sortedAmadeusFlights = sortFlights(amadeusFlights, "amadeus")
  const sortedDuffelFlights = sortFlights(duffelFlights, "duffel")

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <p className="text-lg text-gray-600">Searching for the best flights...</p>
        <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {(hasAmadeusResults || hasDuffelResults) && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-lg font-semibold">
            {hasAmadeusResults && hasDuffelResults
              ? `${amadeusFlights.length + duffelFlights.length} flights found`
              : hasAmadeusResults
                ? `${amadeusFlights.length} flights found`
                : `${duffelFlights.length} flights found`}
          </div>

          <div className="flex items-center gap-2">
            <SortAsc className="h-4 w-4 text-gray-500" />
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as "price" | "duration" | "departure")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price">Price (lowest first)</SelectItem>
                <SelectItem value="duration">Duration (shortest first)</SelectItem>
                <SelectItem value="departure">Departure (earliest first)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="amadeus" disabled={!hasAmadeusResults}>
            Amadeus Results {hasAmadeusResults && `(${amadeusFlights.length})`}
          </TabsTrigger>
          <TabsTrigger value="duffel" disabled={!hasDuffelResults}>
            Duffel Results {hasDuffelResults && `(${duffelFlights.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="amadeus">
          {hasAmadeusResults ? (
            <ScrollArea className="h-[600px] pr-4">
              {sortedAmadeusFlights.map((flight: any, index: number) => (
                <FlightCard
                  key={`amadeus-${index}`}
                  flight={flight}
                  provider="amadeus"
                  onSelect={() => onSelectFlight(flight, "amadeus")}
                />
              ))}
            </ScrollArea>
          ) : (
            <div className="text-center py-10 text-gray-500">No results found from Amadeus API</div>
          )}
        </TabsContent>

        <TabsContent value="duffel">
          {hasDuffelResults ? (
            <ScrollArea className="h-[600px] pr-4">
              {sortedDuffelFlights.map((flight: any, index: number) => (
                <FlightCard
                  key={`duffel-${index}`}
                  flight={flight}
                  provider="duffel"
                  onSelect={() => onSelectFlight(flight, "duffel")}
                />
              ))}
            </ScrollArea>
          ) : (
            <div className="text-center py-10 text-gray-500">No results found from Duffel API</div>
          )}
        </TabsContent>
      </Tabs>

      {hasNoResults && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-700 font-medium mb-2">No flight results found</p>
          <p className="text-yellow-600 text-sm mb-4">
            Try adjusting your search criteria or selecting different dates.
          </p>
          <Button variant="outline" onClick={() => window.history.back()} className="mt-2">
            Back to Search
          </Button>
        </div>
      )}
    </div>
  )
}
