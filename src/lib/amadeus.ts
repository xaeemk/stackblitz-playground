"use server"

// Amadeus API utility
const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET
const AMADEUS_BASE_URL = "https://test.api.amadeus.com"

// Get Amadeus access token
export async function getAmadeusToken(): Promise<string> {
  try {
    const response = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: AMADEUS_API_KEY || "",
        client_secret: AMADEUS_API_SECRET || "",
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      console.error("Amadeus authentication error:", data)
      throw new Error("Failed to authenticate with Amadeus API")
    }

    return data.access_token
  } catch (error) {
    console.error("Error getting Amadeus token:", error)
    throw error
  }
}

// Search for flights
export async function searchFlights(params: {
  originLocationCode: string
  destinationLocationCode: string
  departureDate: string
  returnDate?: string
  adults: number
  travelClass: string
}) {
  try {
    const token = await getAmadeusToken()

    // Build query string
    const queryParams = new URLSearchParams({
      originLocationCode: params.originLocationCode,
      destinationLocationCode: params.destinationLocationCode,
      departureDate: params.departureDate,
      adults: params.adults.toString(),
      travelClass: params.travelClass,
      currencyCode: "USD",
      max: "10",
    })

    if (params.returnDate) {
      queryParams.append("returnDate", params.returnDate)
    }

    const response = await fetch(`${AMADEUS_BASE_URL}/v2/shopping/flight-offers?${queryParams.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()
    if (!response.ok) {
      console.error("Amadeus flight search error:", data)
      throw new Error("Failed to search flights")
    }

    return data
  } catch (error) {
    console.error("Error searching flights:", error)
    throw error
  }
}

// Get flight price
export async function getFlightPrice(flightOffer: any) {
  try {
    const token = await getAmadeusToken()

    const response = await fetch(`${AMADEUS_BASE_URL}/v1/shopping/flight-offers/pricing`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          type: "flight-offers-pricing",
          flightOffers: [flightOffer],
        },
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      console.error("Amadeus flight pricing error:", data)
      throw new Error("Failed to get flight price")
    }

    return data
  } catch (error) {
    console.error("Error getting flight price:", error)
    throw error
  }
}

// Book a flight
export async function bookFlight(flightOffer: any, travelerInfo: any) {
  try {
    const token = await getAmadeusToken()

    const response = await fetch(`${AMADEUS_BASE_URL}/v1/booking/flight-orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          type: "flight-order",
          flightOffers: [flightOffer],
          travelers: [travelerInfo],
        },
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      console.error("Amadeus flight booking error:", data)
      throw new Error("Failed to book flight")
    }

    return data
  } catch (error) {
    console.error("Error booking flight:", error)
    throw error
  }
}
