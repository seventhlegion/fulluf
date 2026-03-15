import type { GetTokenFn } from "@/lib/helpers/http"
import { createAuthHttp, createHttp } from "@/lib/helpers/http"
import type {
  LoginRequest,
  LoginResponse,
  Message,
  RefreshResponse,
} from "./types"

const http = createHttp()

export async function login(data: LoginRequest): Promise<LoginResponse> {
  return http.post("auth/login", { json: data }).json<LoginResponse>()
}

export async function refresh(refreshToken: string): Promise<RefreshResponse> {
  return http
    .post("auth/refresh", { json: { refreshToken } })
    .json<RefreshResponse>()
}

export interface FetchMessagesParams {
  limit?: number;
  before?: string;
  after?: string;
}

export function createChatRequests(getToken: GetTokenFn) {
  const authHttp = createAuthHttp(getToken)

  return {
    createMediaMessage: async (formData: FormData): Promise<Message> => {
      return authHttp
        .post("chat/messages/media", { body: formData })
        .json<Message>()
    },

    /** Fetches messages via REST - reliable, works regardless of WebSocket state */
    fetchMessages: async (params?: FetchMessagesParams): Promise<Message[]> => {
      const searchParams = new URLSearchParams()
      if (params?.limit) searchParams.set("limit", String(params.limit))
      if (params?.before) searchParams.set("before", params.before)
      if (params?.after) searchParams.set("after", params.after)
      const qs = searchParams.toString()
      return authHttp.get(`chat/messages${qs ? `?${qs}` : ""}`).json<Message[]>()
    },

    /** Fetches media with auth and returns blob URL. Caller must revoke the URL when done. */
    fetchMediaBlob: async (filename: string): Promise<string> => {
      const res = await authHttp.get(`chat/media/${filename}`).blob()
      return URL.createObjectURL(res)
    },
  }
}
