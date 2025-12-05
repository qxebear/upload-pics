import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL || "";

if (!REDIS_URL) {
  throw new Error("Please define the REDIS_URL environment variable");
}

let client: ReturnType<typeof createClient> | null = null;

export async function redisConnect() {
  if (!client) {
    client = createClient({ url: process.env.REDIS_URL });
    client.on("error", (err) => console.error("Redis Error:", err));
    await client.connect();
  }
  return client;
}

export async function getFromRedis<T>(redis_key: string): Promise<T | null> {
  const redis = await redisConnect();
  const data = await redis.get(redis_key);

  if (!data) return null; // Return null if no cached data

  try {
    return typeof data === "string" ? (data as T) : (JSON.parse(data) as T);
  } catch (error) {
    console.error("Error parsing JSON from Redis:", error);
    return null;
  }
}

export async function saveToRedis<T>(
  redis_key: string,
  data: T,
  expires?: number,
) {
  const redis = await redisConnect();
  await redis.set(redis_key, JSON.stringify(data), { EX: expires });
}
