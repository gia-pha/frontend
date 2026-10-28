// HTTP client for the auth backend's passkey API. Every method maps to exactly
// one endpoint, so each method has its own contract test in
// tests/contracts/auth-api.test.ts and no method calls another one.
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/browser';

// Empty base url keeps the calls same-origin (see .env.demo and the vite proxy).
const API_BASE_URL =
  import.meta.env.VITE_AUTH_BACKEND_URL ?? 'http://localhost:8080';

export interface AuthApi {
  registerStart(name: string): Promise<PublicKeyCredentialCreationOptionsJSON>;
  registerFinish(attestation: RegistrationResponseJSON): Promise<void>;
  loginStart(): Promise<PublicKeyCredentialRequestOptionsJSON>;
  loginFinish(assertion: AuthenticationResponseJSON): Promise<void>;
  logout(): Promise<void>;
}

export interface AuthApiOptions {
  /** Backend origin. Defaults to API_BASE_URL. */
  baseUrl?: string;
  /** Transport. Defaults to the global fetch, resolved per call. */
  fetch?: typeof globalThis.fetch;
}

export function createAuthApi(options: AuthApiOptions = {}): AuthApi {
  const base = options.baseUrl ?? API_BASE_URL;

  async function post<T>(path: string, body?: unknown): Promise<T> {
    const doFetch = options.fetch ?? globalThis.fetch;
    const response = await doFetch(`${base}${path}`, {
      method: 'POST',
      // The backend tracks the passkey ceremony in its HttpOnly `sid` cookie,
      // which the browser attaches to every call.
      credentials: 'include',
      ...(body === undefined
        ? {}
        : {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(text || response.statusText);
    return text ? (JSON.parse(text) as T) : (undefined as T);
  }

  return {
    async registerStart(name) {
      const { publicKey } = await post<{
        publicKey: PublicKeyCredentialCreationOptionsJSON;
      }>('/api/passkey/registerStart', { name });
      return publicKey;
    },

    async registerFinish(attestation) {
      await post<void>('/api/passkey/registerFinish', attestation);
    },

    async loginStart() {
      const { publicKey } = await post<{
        publicKey: PublicKeyCredentialRequestOptionsJSON;
      }>('/api/passkey/loginStart');
      return publicKey;
    },

    async loginFinish(assertion) {
      await post<void>('/api/passkey/loginFinish', assertion);
    },

    async logout() {
      await post<void>('/api/logout');
    },
  };
}

export const authApi = createAuthApi();
