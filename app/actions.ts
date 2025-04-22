"use server"

import {
  createUser,
  getUserByPhone,
  updateUserCheckIn,
  updateUserCheckOut,
  storeOTP,
  verifyOTP,
  generateOTP,
} from "@/lib/user-service"
import { sendSMS } from "@/lib/twilio"
import type { UserData } from "@/app/page"

export async function registerUser(userData: UserData): Promise<{ userId: string }> {
  try {
    // Check if user already exists
    const existingUser = await getUserByPhone(userData.phone)

    if (existingUser) {
      return { userId: existingUser.userId as string }
    }

    // Create new user
    const userId = await createUser(userData)
    return { userId }
  } catch (error) {
    console.error("Error registering user:", error)
    throw new Error("Failed to register user")
  }
}

export async function sendOTP(phone: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Generate and store OTP
    const otp = await generateOTP()
    await storeOTP(phone, otp)

    // For development, log the OTP
    console.log(`OTP for ${phone}: ${otp}`)

    // Send OTP via SMS
    const message = `Your verification code is: ${otp}. Valid for 5 minutes.`
    const result = await sendSMS(phone, message)

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Failed to send verification code. Please try again.",
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error sending OTP:", error)
    return {
      success: false,
      error: "Error sending verification code: " + (error instanceof Error ? error.message : "Unknown error"),
    }
  }
}

export async function checkOTP(phone: string, otp: string): Promise<{ success: boolean }> {
  try {
    const isValid = await verifyOTP(phone, otp)
    return { success: isValid }
  } catch (error) {
    console.error("Error verifying OTP:", error)
    return { success: false }
  }
}

export async function recordCheckIn(userId: string, checkInTime: string): Promise<{ success: boolean }> {
  try {
    await updateUserCheckIn(userId, checkInTime)
    return { success: true }
  } catch (error) {
    console.error("Error recording check-in:", error)
    return { success: false }
  }
}

export async function recordCheckOut(userId: string, checkOutTime: string): Promise<{ success: boolean }> {
  try {
    await updateUserCheckOut(userId, checkOutTime)
    return { success: true }
  } catch (error) {
    console.error("Error recording check-out:", error)
    return { success: false }
  }
}
