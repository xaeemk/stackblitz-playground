import { useState, useEffect, useRef } from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Common airports data
const commonAirports = [
  { code: "JFK", name: "John F. Kennedy International Airport", city: "New York" },
  { code: "LAX", name: "Los Angeles International Airport", city: "Los Angeles" },
  { code: "LHR", name: "Heathrow Airport", city: "London" },
  { code: "CDG", name: "Charles de Gaulle Airport", city: "Paris" },
  { code: "DXB", name: "Dubai International Airport", city: "Dubai" },
  { code: "HND", name: "Haneda Airport", city: "Tokyo" },
  { code: "SIN", name: "Singapore Changi Airport", city: "Singapore" },
  { code: "SFO", name: "San Francisco International Airport", city: "San Francisco" },
  { code: "ORD", name: "O'Hare International Airport", city: "Chicago" },
  { code: "ATL", name: "Hartsfield-Jackson Atlanta International Airport", city: "Atlanta" },
  { code: "AMS", name: "Amsterdam Airport Schiphol", city: "Amsterdam" },
  { code: "FRA", name: "Frankfurt Airport", city: "Frankfurt" },
  { code: "HKG", name: "Hong Kong International Airport", city: "Hong Kong" },
  { code: "ICN", name: "Incheon International Airport", city: "Seoul" },
  { code: "BKK", name: "Suvarnabhumi Airport", city: "Bangkok" },
  { code: "SYD", name: "Sydney Airport", city: "Sydney" },
  { code: "MEX", name: "Mexico City International Airport", city: "Mexico City" },
  { code: "MIA", name: "Miami International Airport", city: "Miami" },
  { code: "MAD", name: "Adolfo Suárez Madrid–Barajas Airport", city: "Madrid" },
  { code: "FCO", name: "Leonardo da Vinci–Fiumicino Airport", city: "Rome" },
]

interface AirportAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function AirportAutocomplete({
  value,
  onChange,
  placeholder = "Select airport",
  disabled = false,
}: AirportAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [airports, setAirports] = useState(commonAirports)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Find the selected airport
  const selectedAirport = airports.find((airport) => airport.code === value)

  // Handle search input change
  const handleSearchChange = (search: string) => {
    setSearchTerm(search)

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Set a new timeout to avoid too many searches
    searchTimeoutRef.current = setTimeout(() => {
      if (search.length > 0) {
        setLoading(true)
        // Filter airports based on search term
        const filteredAirports = commonAirports.filter(
          (airport) =>
            airport.code.toLowerCase().includes(search.toLowerCase()) ||
            airport.name.toLowerCase().includes(search.toLowerCase()) ||
            airport.city.toLowerCase().includes(search.toLowerCase()),
        )
        setAirports(filteredAirports)
        setLoading(false)
      } else {
        setAirports(commonAirports)
      }
    }, 300)
  }

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", !value && "text-muted-foreground")}
          disabled={disabled}
        >
          {value ? (
            <div className="flex items-center">
              <span className="font-bold mr-2">{value}</span>
              {selectedAirport && <span className="truncate">{selectedAirport.city}</span>}
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search airport..." value={searchTerm} onValueChange={handleSearchChange} />
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}
          {!loading && (
            <CommandList>
              <CommandEmpty>No airport found.</CommandEmpty>
              <CommandGroup className="max-h-[300px] overflow-auto">
                {airports.map((airport) => (
                  <CommandItem
                    key={airport.code}
                    value={airport.code}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? "" : currentValue)
                      setOpen(false)
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === airport.code ? "opacity-100" : "opacity-0")} />
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <span className="font-bold mr-2">{airport.code}</span>
                        <span>{airport.city}</span>
                      </div>
                      <span className="text-xs text-gray-500 truncate">{airport.name}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
