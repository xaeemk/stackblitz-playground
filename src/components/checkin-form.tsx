import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { UserData } from "@/app/page"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { recordCheckIn } from "@/app/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface CheckinFormProps {
  userData: UserData | null
  onSubmit: (checkInTime: string) => void
}

export function CheckinForm({ userData, onSubmit }: CheckinFormProps) {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [time, setTime] = useState("09:00")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!date || !userData?.userId) return

    setIsLoading(true)
    setError("")

    // Format the check-in time
    const formattedDate = format(date, "PPP")
    const checkInTime = `${formattedDate} at ${time}`

    try {
      // Record check-in in Redis
      const { success } = await recordCheckIn(userData.userId, checkInTime)

      if (success) {
        onSubmit(checkInTime)
      } else {
        setError("Failed to record check-in. Please try again.")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Generate time options in 30-minute intervals
  const timeOptions = []
  for (let hour = 0; hour < 24; hour++) {
    for (const minute of ["00", "30"]) {
      const formattedHour = hour.toString().padStart(2, "0")
      timeOptions.push(`${formattedHour}:${minute}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Welcome, {userData?.name}</h3>
        <p className="text-sm text-gray-500">Please select your check-in date and time.</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Check-in Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Select date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Check-in Time</label>
        <Select value={time} onValueChange={setTime}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select time">
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                {time}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {timeOptions.map((timeOption) => (
              <SelectItem key={timeOption} value={timeOption}>
                {timeOption}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={!date || isLoading}>
        {isLoading ? "Processing..." : "Confirm Check-in"}
      </Button>
    </form>
  )
}
