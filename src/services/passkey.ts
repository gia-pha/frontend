// Drives the passkey ceremonies: ask the backend for options, let the browser
// and the user's device answer them, then hand the result back to the backend.
// The HTTP calls themselves live in the auth api client (src/services/auth-api.ts).
import {
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser';

import { authApi } from './auth-api.js';

export async function register(name: string): Promise<void> {
  const options = await authApi.registerStart(name);
  const attestation = await startRegistration({ optionsJSON: options });
  await authApi.registerFinish(attestation);
}

export async function login(): Promise<void> {
  const options = await authApi.loginStart();
  const assertion = await startAuthentication({ optionsJSON: options });
  await authApi.loginFinish(assertion);
}

export async function logout(): Promise<void> {
  await authApi.logout();
}
