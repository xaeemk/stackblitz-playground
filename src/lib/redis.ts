import { Redis } from "@upstash/redis"

// Create Redis client using environment variables
const redis = Redis.fromEnv()

export default redis
