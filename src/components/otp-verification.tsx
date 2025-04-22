import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { sendOTP, checkOTP } from "@/app/actions"

interface OtpVerificationProps {
  purpose: "registration" | "checkin" | "checkout"
  contactInfo: string
  onVerified: () => void
}

export function OtpVerification({ purpose, contactInfo, onVerified }: OtpVerificationProps) {
  const [otp, setOtp] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState("")
  const [timeLeft, setTimeLeft] = useState(30)
  const [isSending, setIsSending] = useState(false)
  const [smsStatus, setSmsStatus] = useState<"pending" | "sent" | "failed">("pending")

  useEffect(() => {
    // Send OTP when component mounts
    sendOtpToUser()
  }, [])

  useEffect(() => {
    if (timeLeft > 0 && !isVerified) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft, isVerified])

  const sendOtpToUser = async () => {
    if (!contactInfo) return

    setIsSending(true)
    setError("")
    setSmsStatus("pending")

    try {
      const response = await sendOTP(contactInfo)

      if (!response.success) {
        setError(response.error || "Failed to send OTP. Please try again.")
        setSmsStatus("failed")
      } else {
        setTimeLeft(30)
        setSmsStatus("sent")
      }
    } catch (err) {
      setError("Failed to send OTP. Please try again.")
      setSmsStatus("failed")
      console.error(err)
    } finally {
      setIsSending(false)
    }
  }

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP")
      return
    }

    setIsVerifying(true)
    setError("")

    try {
      const { success } = await checkOTP(contactInfo, otp)

      if (success) {
        setIsVerified(true)
        setTimeout(() => {
          onVerified()
        }, 1000)
      } else {
        setError("Invalid OTP. Please try again.")
      }
    } catch (err) {
      setError("Verification failed. Please try again.")
      console.error(err)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    await sendOtpToUser()
  }

  const getPurposeText = () => {
    switch (purpose) {
      case "registration":
        return "registration"
      case "checkin":
        return "check-in"
      case "checkout":
        return "check-out"
      default:
        return "verification"
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-gray-600">
        {smsStatus === "sent" ? (
          <>
            We've sent a verification code to {contactInfo} for your {getPurposeText()}.
          </>
        ) : smsStatus === "failed" ? (
          <>Failed to send SMS. Please use the code displayed in the console.</>
        ) : (
          <>Sending verification code to {contactInfo}...</>
        )}
      </p>

      <div className="flex justify-center my-6">
        <InputOTP maxLength={6} value={otp} onChange={setOtp} disabled={isVerified}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      {error && (
        <Alert variant="destructive" className="my-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isVerified ? (
        <Alert className="bg-green-50 border-green-200 my-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">Verification successful!</AlertDescription>
        </Alert>
      ) : (
        <>
          <Button onClick={handleVerify} className="w-full" disabled={otp.length !== 6 || isVerifying}>
            {isVerifying ? "Verifying..." : "Verify OTP"}
          </Button>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-500">
              {timeLeft > 0 ? (
                <>Didn't receive the code? Resend in {timeLeft}s</>
              ) : (
                <Button variant="link" className="p-0 h-auto text-sm" onClick={handleResend} disabled={isSending}>
                  {isSending ? "Sending..." : "Resend OTP"}
                </Button>
              )}
            </p>
          </div>
        </>
      )}
    </div>
  )
}
