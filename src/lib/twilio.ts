import type { Twilio } from "twilio"

// Function to send SMS
export async function sendSMS(to: string, body: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if environment variables are available
    if (!process.env.TWILIO_ID || !process.env.TWILIO_AUTH || !process.env.TWILIO_NUMBER) {
      console.error("Twilio credentials are not properly configured")
      return { success: false, error: "SMS service not configured properly" }
    }

    // Format phone number
    const formattedNumber = formatPhoneNumber(to)

    // Dynamically import Twilio to avoid initialization issues
    const twilio = (await import("twilio")).default
    const client = twilio(process.env.TWILIO_ID, process.env.TWILIO_AUTH) as Twilio

    // Send SMS
    await client.messages.create({
      body,
      from: process.env.TWILIO_NUMBER,
      to: formattedNumber,
    })

    return { success: true }
  } catch (error) {
    console.error("Error sending SMS:", error)
    return {
      success: false,
      error: `SMS sending failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

// Helper function to ensure phone number is properly formatted
function formatPhoneNumber(phone: string): string {
  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, "")

  // If the number doesn't start with +, add +1 (US) as default
  if (!phone.startsWith("+")) {
    return `+1${digits}`
  }

  return phone
}
