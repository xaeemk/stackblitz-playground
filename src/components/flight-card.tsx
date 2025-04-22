import { useState } from "react"
import { format } from "date-fns"
import { ChevronDown, ChevronUp, Clock, Luggage, Plane, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/formatters"

interface FlightCardProps {
  flight: any
  provider: "amadeus" | "duffel"
  onSelect: () => void
}

export function FlightCard({ flight, provider, onSelect }: FlightCardProps) {
  const [expanded, setExpanded] = useState(false)

  // Guard against undefined flight
  if (!flight) {
    return (
      <Card className="mb-4 p-4 text-center">
        <p className="text-red-500">Flight data unavailable</p>
      </Card>
    )
  }

  // Format price - with safety checks
  const getPrice = () => {
    if (provider === "amadeus") {
      return flight?.price?.total
    } else {
      return flight?.total_amount
    }
  }

  // Get airline name - with safety checks
  const getAirlineName = () => {
    if (provider === "amadeus") {
      return flight?.validatingAirlineCodes?.[0] || "Multiple Airlines"
    } else {
      return flight?.owner?.name || "Multiple Airlines"
    }
  }

  // Get segments - with safety checks
  const getSegments = () => {
    if (provider === "amadeus") {
      const itineraries = flight?.itineraries || []
      return itineraries.map((itinerary: any, index: number) => ({
        type: index === 0 ? "outbound" : "return",
        segments: itinerary?.segments || [],
      }))
    } else {
      const slices = flight?.slices || []
      return slices.map((slice: any, index: number) => ({
        type: index === 0 ? "outbound" : "return",
        segments: slice?.segments || [],
      }))
    }
  }

  // Get segment details - with safety checks
  const getSegmentDetails = (segment: any) => {
    if (!segment)
      return {
        departureTime: "",
        departureCode: "???",
        arrivalTime: "",
        arrivalCode: "???",
        carrier: "Unknown",
        flightNumber: "",
        aircraft: "",
      }

    if (provider === "amadeus") {
      return {
        departureTime: segment?.departure?.at || "",
        departureCode: segment?.departure?.iataCode || "???",
        arrivalTime: segment?.arrival?.at || "",
        arrivalCode: segment?.arrival?.iataCode || "???",
        carrier: segment?.carrierCode || "Unknown",
        flightNumber: segment?.number || "",
        aircraft: segment?.aircraft?.code || "",
      }
    } else {
      return {
        departureTime: segment?.departing_at || "",
        departureCode: segment?.origin?.iata_code || "???",
        arrivalTime: segment?.arriving_at || "",
        arrivalCode: segment?.destination?.iata_code || "???",
        carrier: segment?.marketing_carrier?.name || "Unknown",
        flightNumber: segment?.marketing_carrier_flight_number || "",
        aircraft: segment?.aircraft?.name || "",
      }
    }
  }

  // Get passenger count - with safety checks
  const getPassengerCount = () => {
    if (provider === "amadeus") {
      return flight?.travelerPricings?.length || 1
    } else {
      return flight?.passengers_count || 1
    }
  }

  // Get stops count - with safety checks
  const getStopsCount = (segments: any[]) => {
    if (!Array.isArray(segments)) return 0
    return segments.length > 1 ? segments.length - 1 : 0
  }

  // Calculate flight duration - with safety checks
  const calculateDuration = (departure: string, arrival: string) => {
    if (!departure || !arrival) return "N/A"

    try {
      const departureTime = new Date(departure)
      const arrivalTime = new Date(arrival)
      const durationMinutes = (arrivalTime.getTime() - departureTime.getTime()) / (1000 * 60)
      const hours = Math.floor(durationMinutes / 60)
      const minutes = Math.floor(durationMinutes % 60)
      return `${hours}h ${minutes}m`
    } catch (error) {
      console.error("Error calculating duration:", error)
      return "N/A"
    }
  }

  // Render flight segments - with safety checks
  const renderSegments = () => {
    const segments = getSegments()
    if (!segments || segments.length === 0) {
      return <p className="text-gray-500">No flight segments available</p>
    }

    return segments.map((segment: any, index: number) => {
      if (!segment) return null

      const stopsCount = getStopsCount(segment.segments)

      // Safety check for empty segments
      if (!Array.isArray(segment.segments) || segment.segments.length === 0) {
        return (
          <div key={index} className={cn("py-2", index > 0 && "mt-2 border-t border-gray-200")}>
            <div className="text-gray-500">Flight segment details unavailable</div>
          </div>
        )
      }

      const firstSegment = segment.segments[0]
      const lastSegment = segment.segments[segment.segments.length - 1]

      const firstSegmentDetails = getSegmentDetails(firstSegment)
      const lastSegmentDetails = getSegmentDetails(lastSegment)

      // Safety check for missing times
      const totalDuration =
        firstSegmentDetails.departureTime && lastSegmentDetails.arrivalTime
          ? calculateDuration(firstSegmentDetails.departureTime, lastSegmentDetails.arrivalTime)
          : "N/A"

      return (
        <div key={index} className={cn("py-2", index > 0 && "mt-2 border-t border-gray-200")}>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={index === 0 ? "default" : "secondary"} className="capitalize">
              {segment.type}
            </Badge>
            <span className="text-sm text-gray-500">
              {stopsCount === 0 ? "Direct" : `${stopsCount} ${stopsCount === 1 ? "stop" : "stops"}`}
            </span>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Clock className="h-3 w-3" /> {totalDuration}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-lg font-semibold">
                {firstSegmentDetails.departureTime
                  ? format(new Date(firstSegmentDetails.departureTime), "HH:mm")
                  : "N/A"}
              </span>
              <span className="text-sm text-gray-500">{firstSegmentDetails.departureCode}</span>
            </div>

            <div className="flex-1 mx-4">
              <div className="relative h-0.5 bg-gray-200">
                {stopsCount > 0 && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                    <span className="text-xs text-gray-500">{stopsCount === 1 ? "1 stop" : `${stopsCount} stops`}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-lg font-semibold">
                {lastSegmentDetails.arrivalTime ? format(new Date(lastSegmentDetails.arrivalTime), "HH:mm") : "N/A"}
              </span>
              <span className="text-sm text-gray-500">{lastSegmentDetails.arrivalCode}</span>
            </div>
          </div>

          {expanded && (
            <div className="mt-4 space-y-4">
              {segment.segments.map((seg: any, segIndex: number) => {
                if (!seg) return null
                const details = getSegmentDetails(seg)
                return (
                  <div key={segIndex} className={segIndex > 0 ? "pt-4 border-t border-dashed border-gray-200" : ""}>
                    <div className="flex items-center gap-2 mb-2">
                      <Plane className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium">
                        {details.carrier} {details.flightNumber}
                      </span>
                      {details.aircraft && <span className="text-xs text-gray-500">{details.aircraft}</span>}
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {details.departureTime ? format(new Date(details.departureTime), "HH:mm") : "N/A"}
                        </span>
                        <span className="text-sm text-gray-500">{details.departureCode}</span>
                        <span className="text-xs text-gray-400">
                          {details.departureTime ? format(new Date(details.departureTime), "d MMM") : "N/A"}
                        </span>
                      </div>

                      <div className="flex flex-col items-center">
                        <span className="text-xs text-gray-500">
                          {details.departureTime && details.arrivalTime
                            ? calculateDuration(details.departureTime, details.arrivalTime)
                            : "N/A"}
                        </span>
                        <div className="relative w-24 h-0.5 bg-gray-200 my-1">
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gray-400"></div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <span className="font-medium">
                          {details.arrivalTime ? format(new Date(details.arrivalTime), "HH:mm") : "N/A"}
                        </span>
                        <span className="text-sm text-gray-500">{details.arrivalCode}</span>
                        <span className="text-xs text-gray-400">
                          {details.arrivalTime ? format(new Date(details.arrivalTime), "d MMM") : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )
    })
  }

  return (
    <Card className="mb-4 overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="bg-blue-50 pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <Plane className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-lg font-bold text-blue-800">{getAirlineName()}</span>
          </div>
          <span className="text-xl font-bold text-green-700">{formatPrice(getPrice())}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {renderSegments()}

        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="w-full mt-2 text-gray-500">
          {expanded ? (
            <span className="flex items-center gap-1">
              <ChevronUp className="h-4 w-4" /> Show less
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <ChevronDown className="h-4 w-4" /> Show details
            </span>
          )}
        </Button>
      </CardContent>
      <CardFooter className="bg-gray-50 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {getPassengerCount()} {getPassengerCount() === 1 ? "passenger" : "passengers"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Luggage className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Cabin bag included</span>
          </div>
        </div>
        <Button onClick={onSelect} className="bg-blue-600 hover:bg-blue-700">
          Select
        </Button>
      </CardFooter>
    </Card>
  )
}
