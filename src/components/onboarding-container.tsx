import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface OnboardingContainerProps {
  children: React.ReactNode
  currentStep: number
  totalSteps: number
  className?: string
}

export function OnboardingContainer({ children, currentStep, totalSteps, className }: OnboardingContainerProps) {
  const progress = (currentStep / totalSteps) * 100

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Registration"
      case 2:
        return "Verify Registration"
      case 3:
        return "Check-in"
      case 4:
        return "Verify Check-in"
      case 5:
        return "Check-out"
      case 6:
        return "Verify Check-out"
      case 7:
        return "Confirmation"
      case 8:
        return "Flight Booking"
      case 9:
        return "Booking Confirmation"
      default:
        return "Onboarding"
    }
  }

  return (
    <Card className={cn("w-full shadow-lg", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-center">{getStepTitle()}</CardTitle>
        <Progress value={progress} className="h-2 mt-2" />
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  )
}
