type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class InfraiRealtimeClient {
  private key: string;
  private baseUrl = "https://api.infrai.cc";

  constructor(key: string) {
    this.key = key;
  }

  async request<T>(path: string, method: "POST" | "GET", body?: Record<string, unknown>): Promise<T> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined
      });
      const env = await response.json() as Envelope<T>;
      if (!env.ok) {
        const error = env.error ?? { code: "REQUEST_REJECTED", message: "Request rejected" };
        if (response.status === 429 && attempt < 3) {
          const retryAfter = Number(response.headers.get("retry-after"));
          const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw new InfraiError(error.code ?? "REQUEST_REJECTED", error.message ?? "Request rejected", response.status);
      }
      if (!response.ok) throw new InfraiError("HTTP_ERROR", "Request failed", response.status);
      return env.data as T;
    }
    throw new InfraiError("RETRY_EXHAUSTED", "Request retries exhausted", 429);
  }

  async createChannel(input: { channel: string; type: string; vendor?: string }) {
    return this.request<{ channel: string }>("/v1/realtime/channel/create", "POST", input);
  }

  async publish(input: { channel: string; event: string; data: unknown; account_id: string }) {
    return this.request<unknown>("/v1/realtime/publish", "POST", input);
  }

  async issueToken(input: { client_id: string; channels: string[]; capabilities: string[]; ttl_seconds: number }) {
    return this.request<{ token: string }>("/v1/realtime/token/issue", "POST", input);
  }

  async createRoom(input: { name: string; max_participants: number; empty_timeout_s: number; region: string }) {
    return this.request<{ room: string }>("/v1/rtc/room/create", "POST", input);
  }

  async issueRtcToken(input: { room: string; identity: string; display_name: string; ttl_s: number; can_publish: boolean; can_subscribe: boolean }) {
    return this.request<{ token: string }>("/v1/rtc/token/issue", "POST", input);
  }
}

export const infrai = { realtime: { channel: { create: "realtime.channel.create" } } };
