import redis from "./redis"
import { v4 as uuidv4 } from "uuid"
import type { UserData } from "@/lib/types"

// Store for development OTPs (not for production use)
const devOtps: Record<string, string> = {}

// User-related operations
export async function createUser(userData: UserData): Promise<string> {
  const userId = uuidv4()
  await redis.hset(`user:${userId}`, { ...userData, userId })
  await redis.set(`user:email:${userData.email}`, userId)
  await redis.set(`user:phone:${userData.phone}`, userId)
  return userId
}

export async function getUserById(userId: string): Promise<UserData | null> {
  const userData = await redis.hgetall(`user:${userId}`)

  if (!userData) {
    return null;
  }

  const { name, email, phone, userId: id, checkInTime, checkOutTime } = userData;

  if (!name || !email || !phone) {
    console.error("Incomplete user data retrieved from Redis:", userData);
    return null;
  }

  const typedUserData: UserData = {
    name: name as string,
    email: email as string,
    phone: phone as string,
    userId: id as string,
    checkInTime: checkInTime as string | undefined,
    checkOutTime: checkOutTime as string | undefined,
  };

  return typedUserData;
}

export async function getUserByPhone(phone: string): Promise<UserData | null> {
  const userId = await redis.get(`user:phone:${phone}`)
  if (!userId) return null
  return getUserById(userId as string)
}

export async function getUserByEmail(email: string): Promise<UserData | null> {
  const userId = await redis.get(`user:email:${email}`)
  if (!userId) return null
  return getUserById(userId as string)
}

export async function updateUserCheckIn(userId: string, checkInTime: string): Promise<void> {
  await redis.hset(`user:${userId}`, { checkInTime })
}

export async function updateUserCheckOut(userId: string, checkOutTime: string): Promise<void> {
  await redis.hset(`user:${userId}`, { checkOutTime })
}

// OTP-related operations
export async function storeOTP(phone: string, otp: string): Promise<void> {
  // Store OTP with 5-minute expiration
  await redis.set(`otp:${phone}`, otp, { ex: 300 })

  // Also store in memory for development fallback
  devOtps[phone] = otp
}

export async function verifyOTP(phone: string, otp: string): Promise<boolean> {
  const storedOTP = (await redis.get(`otp:${phone}`)) as string | null

  // Check Redis first, then fallback to dev storage
  return storedOTP === otp || devOtps[phone] === otp
}

export async function generateOTP(): Promise<string> {
  // Generate a 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString()
}
