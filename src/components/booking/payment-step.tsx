"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, Smartphone, Wallet } from "lucide-react"

interface PaymentStepProps {
  onPay: (method: string) => void
  amount: string | number
  currency?: string
}

export function PaymentStep({ onPay, amount, currency = "USD" }: PaymentStepProps) {
  const formattedAmount =
    typeof amount === "string"
      ? amount
      : new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: currency,
        }).format(amount)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose Payment Method</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center mb-4">
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-2xl font-bold text-blue-700">{formattedAmount}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button
            onClick={() => onPay("CREDIT_CARD")}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 py-6"
          >
            <CreditCard className="h-5 w-5" />
            Credit Card
          </Button>
          <Button
            onClick={() => onPay("MOBILE_BANKING")}
            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2 py-6"
          >
            <Smartphone className="h-5 w-5" />
            Mobile Banking
          </Button>
          <Button
            onClick={() => onPay("DIGITAL_WALLET")}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 py-6"
          >
            <Wallet className="h-5 w-5" />
            Digital Wallet
          </Button>
        </div>

        <p className="text-xs text-center text-gray-500 mt-4">
          All payments are secure and encrypted. By proceeding, you agree to our Terms of Service.
        </p>
      </CardContent>
    </Card>
  )
}
