export const formatFlightDetails = (flightData: any, provider?: string) => {
  // Handle null/undefined flight data
  if (!flightData) {
    console.warn("Missing flightData in formatFlightDetails")
    return "Flight details unavailable"
  }

  // Handle Amadeus format
  if (provider === "amadeus") {
    if (!flightData.itineraries || !Array.isArray(flightData.itineraries) || flightData.itineraries.length === 0) {
      console.warn("Invalid Amadeus flight data structure:", flightData)
      return "Flight details unavailable"
    }

    return flightData.itineraries
      .map((itinerary: any, index: number) => {
        if (
          !itinerary ||
          !itinerary.segments ||
          !Array.isArray(itinerary.segments) ||
          itinerary.segments.length === 0
        ) {
          return "Flight details unavailable"
        }

        const firstSegment = itinerary.segments[0]
        const lastSegment = itinerary.segments[itinerary.segments.length - 1]

        const from = firstSegment?.departure?.iataCode || "???"
        const to = lastSegment?.arrival?.iataCode || "???"
        const time = firstSegment?.departure?.at
          ? new Date(firstSegment.departure.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "N/A"

        return `${index === 0 ? "Outbound" : "Return"}: ${from} → ${to} (${time})`
      })
      .join(" | ")
  }

  // Handle Duffel format (default)
  // CRITICAL FIX: Check if slices exists before trying to access it
  if (!flightData.slices || !Array.isArray(flightData.slices) || flightData.slices.length === 0) {
    console.warn("Invalid Duffel flight data structure:", flightData)
    return "Flight details unavailable"
  }

  return flightData.slices
    .map((slice: any, index: number) => {
      if (!slice) return "Flight details unavailable"

      const from = slice?.origin?.iata_code || "???"
      const to = slice?.destination?.iata_code || "???"
      const time = slice?.departure_time
        ? new Date(slice.departure_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "N/A"

      return `${index === 0 ? "Outbound" : "Return"}: ${from} → ${to} (${time})`
    })
    .join(" | ")
}

export const formatPrice = (price: string | number | undefined, currency = "USD") => {
  if (price === undefined || price === null) return "N/A"

  try {
    const numericPrice = typeof price === "string" ? Number.parseFloat(price) : price
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(numericPrice)
  } catch (error) {
    console.error("Error formatting price:", error)
    return `${price} ${currency}`
  }
}
