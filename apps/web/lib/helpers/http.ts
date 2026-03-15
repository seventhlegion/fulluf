import ky, { type KyInstance, type Options } from "ky";

const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001")
    : process.env.API_URL ?? "http://localhost:3001";

export type GetTokenFn = () => string | null | Promise<string | null>;

export interface CreateHttpOptions {
  getToken?: GetTokenFn;
}

/**
 * Creates an HTTP client using ky with optional JWT auth.
 * Use getToken to provide a function that returns the current access token (or Promise when refreshing).
 */
export function createHttp(options: CreateHttpOptions = {}): KyInstance {
  const { getToken } = options;

  return ky.create({
    prefixUrl: API_BASE,
    timeout: 30_000,
    retry: {
      limit: 2,
      statusCodes: [408, 413, 429, 500, 502, 503, 504],
      methods: ["get"],
    },
    hooks: {
      beforeRequest: [
        async (request) => {
          const token = await Promise.resolve(getToken?.() ?? null);
          if (token) {
            request.headers.set("Authorization", `Bearer ${token}`);
          }
        },
      ],
      afterResponse: [
        (_request, _options, response) => {
          if (response.status === 401) {
            // Token expired or invalid - caller can handle via error
          }
          return response;
        },
      ],
    },
  });
}

/** Base HTTP client for unauthenticated requests (e.g. login) */
export const http = createHttp();

/** Factory for authenticated requests - pass a getToken function */
export function createAuthHttp(getToken: GetTokenFn): KyInstance {
  return createHttp({ getToken });
}
