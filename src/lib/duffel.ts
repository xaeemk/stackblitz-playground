"use server"

// Duffel API utility
const DUFFEL_API_KEY = process.env.DUFFEL
const DUFFEL_BASE_URL = "https://api.duffel.com/air"

// Search for flights
export async function searchFlights(params: {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  adults: number
  cabinClass: string
}) {
  try {
    const requestBody = {
      slices: [
        {
          origin: params.origin,
          destination: params.destination,
          departure_date: params.departureDate,
        },
      ],
      passengers: Array(params.adults).fill({ type: "adult" }),
      cabin_class: params.cabinClass.toLowerCase(),
      return_offers: true,
    }

    // Add return flight if returnDate is provided
    if (params.returnDate) {
      requestBody.slices.push({
        origin: params.destination,
        destination: params.origin,
        departure_date: params.returnDate,
      })
    }

    const response = await fetch(`${DUFFEL_BASE_URL}/offer_requests`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DUFFEL_API_KEY}`,
        "Content-Type": "application/json",
        "Duffel-Version": "beta",
      },
      body: JSON.stringify(requestBody),
    })

    const data = await response.json()
    if (!response.ok) {
      console.error("Duffel flight search error:", data)
      throw new Error("Failed to search flights")
    }

    return data
  } catch (error) {
    console.error("Error searching flights with Duffel:", error)
    throw error
  }
}

// Get offer details
export async function getOfferDetails(offerId: string) {
  try {
    const response = await fetch(`${DUFFEL_BASE_URL}/offers/${offerId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${DUFFEL_API_KEY}`,
        "Content-Type": "application/json",
        "Duffel-Version": "beta",
      },
    })

    const data = await response.json()
    if (!response.ok) {
      console.error("Duffel offer details error:", data)
      throw new Error("Failed to get offer details")
    }

    return data
  } catch (error) {
    console.error("Error getting offer details:", error)
    throw error
  }
}

// Book a flight
export async function bookFlight(offerId: string, passengerInfo: any) {
  try {
    const response = await fetch(`${DUFFEL_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DUFFEL_API_KEY}`,
        "Content-Type": "application/json",
        "Duffel-Version": "beta",
      },
      body: JSON.stringify({
        offer_id: offerId,
        passengers: [passengerInfo],
        payments: [
          {
            type: "balance",
            amount: passengerInfo.amount,
            currency: "USD",
          },
        ],
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      console.error("Duffel flight booking error:", data)
      throw new Error("Failed to book flight")
    }

    return data
  } catch (error) {
    console.error("Error booking flight with Duffel:", error)
    throw error
  }
}

// Get booking details
export async function getBookingDetails(orderId: string) {
  try {
    const response = await fetch(`${DUFFEL_BASE_URL}/orders/${orderId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${DUFFEL_API_KEY}`,
        "Content-Type": "application/json",
        "Duffel-Version": "beta",
      },
    })

    const data = await response.json()
    if (!response.ok) {
      console.error("Duffel booking details error:", data)
      throw new Error("Failed to get booking details")
    }

    return data
  } catch (error) {
    console.error("Error getting booking details:", error)
    throw error
  }
}

// Cancel booking
export async function cancelBooking(orderId: string, amount: string) {
  try {
    const response = await fetch(`${DUFFEL_BASE_URL}/orders/${orderId}/cancellations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DUFFEL_API_KEY}`,
        "Content-Type": "application/json",
        "Duffel-Version": "beta",
      },
      body: JSON.stringify({
        refund_amount: amount,
        refund_currency: "USD",
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      console.error("Duffel booking cancellation error:", data)
      throw new Error("Failed to cancel booking")
    }

    return data
  } catch (error) {
    console.error("Error cancelling booking:", error)
    throw error
  }
}
