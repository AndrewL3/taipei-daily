import { Redis } from "@upstash/redis";

let client: Redis | null = null;

function createRedisClient(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set. " +
        "Add them in Vercel project settings → Environment Variables.",
    );
  }
  return new Redis({ url, token });
}

function getRedisClient(): Redis {
  if (!client) {
    client = createRedisClient();
  }
  return client;
}

export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    const resolved = getRedisClient();
    const value = resolved[prop as keyof Redis];
    return typeof value === "function" ? value.bind(resolved) : value;
  },
});
