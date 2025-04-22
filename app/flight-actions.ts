"use server"

import { searchFlights as searchAmadeusFlights } from "@/lib/amadeus"
import { searchFlights as searchDuffelFlights } from "@/lib/duffel"
import redis from "@/lib/redis"

// Search flights using both APIs and combine results
export async function searchFlights(formData: FormData) {
  try {
    const origin = formData.get("origin") as string
    const destination = formData.get("destination") as string
    const departureDate = formData.get("departureDate") as string
    const returnDate = (formData.get("returnDate") as string) || undefined
    const adults = Number.parseInt((formData.get("adults") as string) || "1")
    const cabinClass = (formData.get("cabinClass") as string) || "ECONOMY"

    // Search using Amadeus API
    const amadeusParams = {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate,
      returnDate,
      adults,
      travelClass: cabinClass,
    }

    // Search using Duffel API
    const duffelParams = {
      origin,
      destination,
      departureDate,
      returnDate,
      adults,
      cabinClass,
    }

    // Run both API calls in parallel
    const [amadeusResults, duffelResults] = await Promise.allSettled([
      searchAmadeusFlights(amadeusParams),
      searchDuffelFlights(duffelParams),
    ])

    // Process results
    const results = {
      amadeus: amadeusResults.status === "fulfilled" ? amadeusResults.value : null,
      duffel: duffelResults.status === "fulfilled" ? duffelResults.value : null,
      error: null,
    }

    // Store search results in Redis for 15 minutes
    const searchId = `flight-search:${Date.now()}`
    await redis.set(searchId, JSON.stringify(results), { ex: 900 })

    return { searchId, results }
  } catch (error) {
    console.error("Error searching flights:", error)
    return { error: "Failed to search flights. Please try again." }
  }
}

// Save flight booking
export async function saveFlightBooking(userId: string, bookingData: any) {
  try {
    // Generate booking ID
    const bookingId = `booking:${Date.now()}`

    // Store booking in Redis
    await redis.hset(`user:${userId}:bookings`, {
      [bookingId]: JSON.stringify({
        ...bookingData,
        bookingId,
        bookingDate: new Date().toISOString(),
      }),
    })

    return { success: true, bookingId }
  } catch (error) {
    console.error("Error saving flight booking:", error)
    return { success: false, error: "Failed to save booking" }
  }
}

// Get user's flight bookings
export async function getUserFlightBookings(userId: string) {
  try {
    const bookings = await redis.hgetall(`user:${userId}:bookings`)

    if (!bookings) {
      return { bookings: [] }
    }

    // Parse bookings
    const parsedBookings = Object.values(bookings).map((booking) => JSON.parse(booking as string))

    return { bookings: parsedBookings }
  } catch (error) {
    console.error("Error getting user flight bookings:", error)
    return { bookings: [], error: "Failed to get bookings" }
  }
}
