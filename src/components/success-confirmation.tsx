"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, Plane } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { UserData } from "@/app/page"
import { getUserFlightBookings } from "@/app/flight-actions"

interface SuccessConfirmationProps {
  userData: UserData | null
}

export function SuccessConfirmation({ userData }: SuccessConfirmationProps) {
  const [flightBookings, setFlightBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadBookings() {
      if (userData?.userId) {
        try {
          const result = await getUserFlightBookings(userData.userId)
          setFlightBookings(result.bookings || [])
        } catch (error) {
          console.error("Error loading flight bookings:", error)
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }

    loadBookings()
  }, [userData])

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="rounded-full bg-green-100 p-3">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
      </div>

      <div className="text-center">
        <h3 className="text-xl font-semibold">All Done!</h3>
        <p className="text-gray-500 mt-1">Your onboarding process is complete.</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="bookings">Flight Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card className="bg-gray-50">
            <CardContent className="pt-4 pb-2">
              <div className="space-y-2 text-left">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Name:</span> {userData?.name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Email:</span> {userData?.email}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Phone:</span> {userData?.phone}
                </p>
                {userData?.checkInTime && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Check-in:</span> {userData.checkInTime}
                  </p>
                )}
                {userData?.checkOutTime && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Check-out:</span> {userData.checkOutTime}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="mt-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              <svg
                className="animate-spin h-8 w-8 mx-auto text-blue-500 mb-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Loading your bookings...
            </div>
          ) : flightBookings.length > 0 ? (
            <div className="space-y-4">
              {flightBookings.map((booking, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="bg-blue-50 p-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Plane className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-800">{booking.flight.details.airline}</span>
                    </div>
                    <span className="text-green-700 font-medium">{booking.flight.details.price}</span>
                  </div>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Route</p>
                        <p className="font-medium">
                          {booking.flight.details.origin} → {booking.flight.details.destination}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Date</p>
                        <p className="font-medium">{booking.flight.details.departureDate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Passenger</p>
                        <p className="font-medium">
                          {booking.passenger.firstName} {booking.passenger.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Booking Date</p>
                        <p className="font-medium">{new Date(booking.bookingDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Plane className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">No flight bookings found</p>
              <p className="text-sm text-gray-400 mt-1">
                Your flight bookings will appear here once you make a reservation.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Button className="w-full" onClick={() => window.location.reload()}>
        Start New Process
      </Button>
    </div>
  )
}
