"use client"

import { cn } from "@/lib/utils"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plane, Calendar, Loader2 } from "lucide-react"
import { AirportAutocomplete } from "./airport-autocomplete"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const flightNumberSchema = z.object({
  airline: z.string().min(2, { message: "Airline code is required" }),
  flightNumber: z.string().min(1, { message: "Flight number is required" }),
})

const routeSchema = z.object({
  origin: z.string().length(3, { message: "Origin airport is required" }),
  destination: z.string().length(3, { message: "Destination airport is required" }),
  date: z.date({ required_error: "Date is required" }),
})

type FlightNumberFormValues = z.infer<typeof flightNumberSchema>
type RouteFormValues = z.infer<typeof routeSchema>

// Define FlightStatus interface for better type safety
interface FlightStatus {
  flightNumber: string
  airline: string
  origin: {
    code: string
    name: string
    city: string
  }
  destination: {
    code: string
    name: string
    city: string
  }
  scheduledDeparture: string
  estimatedDeparture: string
  scheduledArrival: string
  estimatedArrival: string
  status: string
  terminal?: string
  gate?: string
  aircraft: string
  progress: number
}

// Mock flight status data
const mockFlightStatus: FlightStatus = {
  flightNumber: "AA1234",
  airline: "American Airlines",
  origin: {
    code: "LAX",
    name: "Los Angeles International Airport",
    city: "Los Angeles",
  },
  destination: {
    code: "JFK",
    name: "John F. Kennedy International Airport",
    city: "New York",
  },
  scheduledDeparture: "2023-05-15T08:30:00",
  estimatedDeparture: "2023-05-15T08:45:00",
  scheduledArrival: "2023-05-15T16:45:00",
  estimatedArrival: "2023-05-15T17:00:00",
  status: "On Time",
  terminal: "4",
  gate: "B12",
  aircraft: "Boeing 787-9",
  progress: 65, // percentage of flight completed
}

export function FlightStatusTracker() {
  const [activeTab, setActiveTab] = useState<"flightNumber" | "route">("flightNumber")
  const [isLoading, setIsLoading] = useState(false)
  const [flightStatus, setFlightStatus] = useState<FlightStatus | null>(null)

  const flightNumberForm = useForm<FlightNumberFormValues>({
    resolver: zodResolver(flightNumberSchema),
    defaultValues: {
      airline: "",
      flightNumber: "",
    },
  })

  const routeForm = useForm<RouteFormValues>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      origin: "",
      destination: "",
    },
  })

  const onSubmitFlightNumber = async (values: FlightNumberFormValues) => {
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setFlightStatus(mockFlightStatus)
      setIsLoading(false)
    }, 1500)
  }

  const onSubmitRoute = async (values: RouteFormValues) => {
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      // Create a departure date from the selected date
      const departureDate = values.date.toISOString()

      // Calculate arrival date (4 hours later)
      const arrivalDate = new Date(values.date.getTime() + 4 * 60 * 60 * 1000).toISOString()

      setFlightStatus({
        ...mockFlightStatus,
        origin: {
          code: values.origin,
          name: "Origin Airport",
          city: "Origin City",
        },
        destination: {
          code: values.destination,
          name: "Destination Airport",
          city: "Destination City",
        },
        scheduledDeparture: departureDate,
        estimatedDeparture: departureDate,
        scheduledArrival: arrivalDate,
        estimatedArrival: arrivalDate,
      })
      setIsLoading(false)
    }, 1500)
  }

  const resetSearch = () => {
    setFlightStatus(null)
    flightNumberForm.reset()
    routeForm.reset()
  }

  // Render flight status
  const renderFlightStatus = () => {
    if (!flightStatus) {
      return (
        <div className="text-center text-gray-500 py-10">
          No flight data available. Please search again.
        </div>
      )
    }

    // Use optional chaining and default values for safety
    const departureTime = flightStatus?.scheduledDeparture ? new Date(flightStatus.scheduledDeparture) : null
    const arrivalTime = flightStatus?.scheduledArrival ? new Date(flightStatus.scheduledArrival) : null

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={resetSearch}>
            ← New Search
          </Button>
          <div className="text-sm text-gray-500">Last updated: {format(new Date(), "h:mm a")}</div>
        </div>

        <Card>
          <CardHeader className="bg-blue-50">
            <div className="flex justify-between items-center">
              <CardTitle>
                {flightStatus.airline} {flightStatus.flightNumber}
              </CardTitle>
              <Badge
                variant={
                  flightStatus.status === "On Time"
                    ? "success"
                    : flightStatus.status === "Delayed"
                      ? "warning"
                      : flightStatus.status === "Cancelled"
                        ? "destructive"
                        : "outline"
                }
              >
                {flightStatus.status}
              </Badge>
            </div>
            <CardDescription>{format(departureTime, "EEEE, MMMM d, yyyy")}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold">{departureTime ? format(departureTime, "h:mm a") : "TBD"}</div>
                <div className="text-lg font-medium">{flightStatus?.origin?.code}</div>
                <div className="text-sm text-gray-500">{flightStatus?.origin?.city}</div>
                {flightStatus.terminal && flightStatus.gate && (
                  <div className="text-sm mt-2">
                    Terminal {flightStatus.terminal}, Gate {flightStatus.gate}
                  </div>
                )}
              </div>

              <div className="flex-1 px-4 flex flex-col items-center">
                <div className="text-sm text-gray-500 mb-2">
                  {calculateDuration(flightStatus.scheduledDeparture, flightStatus.scheduledArrival)}
                </div>
                <div className="relative w-full h-1 bg-gray-200 rounded-full">
                  <div
                    className="absolute top-0 left-0 h-1 bg-blue-600 rounded-full"
                    style={{ width: `${flightStatus.progress}%` }}
                  ></div>
                  <div
                    className="absolute top-0 h-3 w-3 bg-blue-600 rounded-full -mt-1"
                    style={{ left: `${flightStatus.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between w-full mt-1 text-xs text-gray-500">
                  <span>Departed</span>
                  <span>In Flight</span>
                  <span>Arrived</span>
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold">{arrivalTime ? format(arrivalTime, "h:mm a") : "TBD"}</div>
                <div className="text-lg font-medium">{flightStatus?.destination?.code}</div>
                <div className="text-sm text-gray-500">{flightStatus?.destination?.city}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <div className="text-sm text-gray-500">Aircraft</div>
                <div className="font-medium">{flightStatus.aircraft}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Flight Duration</div>
                <div className="font-medium">
                  {calculateDuration(flightStatus.scheduledDeparture, flightStatus.scheduledArrival)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate flight duration
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

  return (
    <div className="space-y-6">
      {!flightStatus ? (
        <>
          <h2 className="text-2xl font-bold text-center">Track Your Flight</h2>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "flightNumber" | "route")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="flightNumber">By Flight Number</TabsTrigger>
              <TabsTrigger value="route">By Route</TabsTrigger>
            </TabsList>

            <TabsContent value="flightNumber">
              <Card>
                <CardHeader>
                  <CardTitle>Enter Flight Details</CardTitle>
                  <CardDescription>Enter your airline code and flight number to check status</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...flightNumberForm}>
                    <form onSubmit={flightNumberForm.handleSubmit(onSubmitFlightNumber)} className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={flightNumberForm.control}
                          name="airline"
                          render={({ field }) => (
                            <FormItem className="col-span-1">
                              <FormLabel>Airline</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="AA"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                  maxLength={2}
                                  className="uppercase"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={flightNumberForm.control}
                          name="flightNumber"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>Flight Number</FormLabel>
                              <FormControl>
                                <Input placeholder="1234" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Searching...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Plane className="h-4 w-4" />
                            Track Flight
                          </span>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="route">
              <Card>
                <CardHeader>
                  <CardTitle>Enter Route Details</CardTitle>
                  <CardDescription>Search by origin, destination, and date</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...routeForm}>
                    <form onSubmit={routeForm.handleSubmit(onSubmitRoute)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <FormField
                          control={routeForm.control}
                          name="origin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Origin</FormLabel>
                              <FormControl>
                                <AirportAutocomplete
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="Select origin airport"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={routeForm.control}
                          name="destination"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Destination</FormLabel>
                              <FormControl>
                                <AirportAutocomplete
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="Select destination airport"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={routeForm.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !field.value && "text-muted-foreground",
                                    )}
                                  >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {field.value ? format(field.value, "PPP") : <span>Select date</span>}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Searching...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Plane className="h-4 w-4" />
                            Find Flights
                          </span>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        renderFlightStatus()
      )}
    </div>
  )
}
