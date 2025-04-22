import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Plane, Users, Search, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { searchFlights } from "@/app/flight-actions"
import { AirportAutocomplete } from "./airport-autocomplete"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"

const formSchema = z.object({
  origin: z.string().length(3, { message: "Please select an origin airport" }),
  destination: z.string().length(3, { message: "Please select a destination airport" }),
  departureDate: z.date({ required_error: "Please select a departure date" }),
  returnDate: z.date().optional(),
  adults: z.coerce.number().min(1).max(9), // Fixed to coerce number
  cabinClass: z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]),
  tripType: z.enum(["oneWay", "roundTrip"]),
})

type FlightSearchFormValues = z.infer<typeof formSchema>

interface FlightSearchFormProps {
  onSearchResults: (results: any) => void
}

export function FlightSearchForm({ onSearchResults }: FlightSearchFormProps) {
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const form = useForm<FlightSearchFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      origin: "",
      destination: "",
      adults: 1,
      cabinClass: "ECONOMY",
      tripType: "roundTrip",
    },
  })

  // Watch trip type to conditionally render return date field
  const tripType = form.watch("tripType")

  async function onSubmit(values: FlightSearchFormValues) {
    setIsSearching(true)
    setError(null)

    try {
      // Convert form values to FormData
      const formData = new FormData()
      formData.append("origin", values.origin.toUpperCase())
      formData.append("destination", values.destination.toUpperCase())
      formData.append("departureDate", format(values.departureDate, "yyyy-MM-dd"))
      if (values.tripType === "roundTrip" && values.returnDate) {
        formData.append("returnDate", format(values.returnDate, "yyyy-MM-dd"))
      }
      formData.append("adults", values.adults.toString())
      formData.append("cabinClass", values.cabinClass)

      // Search flights
      const response = await searchFlights(formData)

      if (!response || response.error) {
        setError(response?.error || "Something went wrong with the flight search.")
      } else {
        // Reset form after successful search
        // form.reset() // Uncomment if you want to reset the form after search

        // Show success toast
        toast({
          title: "Search completed",
          description: "Found flights matching your criteria.",
          duration: 3000,
        })

        onSearchResults(response)
      }
    } catch (err) {
      setError("An error occurred while searching for flights. Please try again.")
      console.error(err)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Find Your Perfect Flight</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="tripType"
            render={({ field }) => (
              <FormItem>
                <Tabs
                  defaultValue={field.value}
                  onValueChange={(value) => field.onChange(value as "oneWay" | "roundTrip")}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="oneWay">One Way</TabsTrigger>
                    <TabsTrigger value="roundTrip">Round Trip</TabsTrigger>
                  </TabsList>
                </Tabs>
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <FormField
              control={form.control}
              name="origin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Plane className="h-4 w-4 rotate-45" />
                    From
                  </FormLabel>
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

            <div className="hidden md:flex justify-center items-center">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <ArrowRight className="h-5 w-5 text-blue-600" />
              </div>
            </div>

            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem className="md:col-start-2">
                  <FormLabel className="flex items-center gap-2">
                    <Plane className="h-4 w-4 -rotate-45" />
                    To
                  </FormLabel>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="departureDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Departure Date
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {tripType === "roundTrip" && (
              <FormField
                control={form.control}
                name="returnDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Return Date
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) => {
                            const departureDate = form.getValues("departureDate")
                            return (
                              date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                              (departureDate && date < departureDate)
                            )
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="adults"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Passengers
                  </FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number.parseInt(value))}
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select number of passengers" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? "passenger" : "passengers"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cabinClass"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cabin Class</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select cabin class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ECONOMY">Economy</SelectItem>
                      <SelectItem value="PREMIUM_ECONOMY">Premium Economy</SelectItem>
                      <SelectItem value="BUSINESS">Business</SelectItem>
                      <SelectItem value="FIRST">First Class</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6" disabled={isSearching}>
            {isSearching ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                Searching Flights...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Flights
              </span>
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}
