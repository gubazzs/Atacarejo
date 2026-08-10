import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Produção: 60 requisições a cada 10s por IP (janela deslizante).
// Folgado pro uso normal (loja/admin), mas corta flood na hora.
export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(), // lê UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN
  limiter: Ratelimit.slidingWindow(60, "10 s"),
  prefix: "atacarejo",
});
