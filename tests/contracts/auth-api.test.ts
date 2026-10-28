// @vitest-environment node
// Consumer contract tests (Pact) for the auth backend. There is one test per
// API client method (src/services/auth-api.ts), each running against its own
// Pact mock provider and contributing one interaction to pacts/, which the
// auth (Go) provider verifies. The tests never depend on each other: every
// provider state seeds exactly what its own request needs, so no test relies
// on a side effect of another call.
import path from 'node:path';

import { MatchersV3 as M, PactV4 } from '@pact-foundation/pact';
import { describe, expect, it } from 'vitest';

import { type AuthApi, createAuthApi } from '../../src/services/auth-api.js';
import { assertion, attestation, params } from './fixtures.js';

// Fixed session ids so the provider state can seed the matching session. They
// also match the sid each flow sets, so `pnpm stub` can serve the whole demo
// flow (login then logout) out of these pacts.
const REG_SESSION = 'pact-reg-session';
const LOGIN_SESSION = 'pact-login-session';

const b64url = /^[A-Za-z0-9_-]+$/;

const newProvider = () =>
  new PactV4({
    consumer: 'frontend',
    provider: 'auth',
    dir: path.resolve(process.cwd(), 'pacts'),
    logLevel: 'warn',
  });

// The session travels in the backend's HttpOnly `sid` cookie: the browser
// attaches it to every call (`credentials: 'include'`), which node fetch does
// not do, so the finish tests hand the client the cookie header the browser
// would have sent. The consumer never reads the value, only its shape.
function apiWithSession(baseUrl: string, sid: string): AuthApi {
  return createAuthApi({
    baseUrl,
    fetch: (input, init = {}) => {
      const headers = new Headers(init.headers);
      headers.set('Cookie', `sid=${sid}`);
      return globalThis.fetch(input, { ...init, headers });
    },
  });
}

const sessionCookie = (sid: string) =>
  M.regex(
    /^sid=[A-Za-z0-9_-]+; Path=\/; Max-Age=3600; HttpOnly; SameSite=Strict$/,
    `sid=${sid}; Path=/; Max-Age=3600; HttpOnly; SameSite=Strict`,
  );

// How the backend drops the session: an empty, already expired `sid` cookie.
const expiredSessionCookie = () =>
  M.regex(
    /^sid=; Path=\/; Max-Age=-1(; Expires=[^;]+)?; HttpOnly; SameSite=Strict$/,
    'sid=; Path=/; Max-Age=-1; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict',
  );

describe('auth api contract (frontend -> auth)', () => {
  it('registerStart sends the name and returns the creation options', async () => {
    const provider = newProvider();

    const interaction = provider
      .addInteraction()
      .given('the auth service is available')
      .uponReceiving('a request to start registration for Alice')
      .withRequest('POST', '/api/passkey/registerStart', (b) => {
        b.headers({ 'Content-Type': 'application/json' });
        b.jsonBody({ name: 'Alice' });
      })
      .willRespondWith(200, (b) => {
        b.headers({
          'Content-Type': 'application/json',
          'Set-Cookie': sessionCookie(REG_SESSION),
        });
        b.jsonBody({
          publicKey: {
            rp: {
              name: M.string('Gia Pha'),
              id: M.regex(/^[a-z0-9.-]+$/, params.rpId),
            },
            user: {
              name: M.string('Alice'),
              displayName: M.string('Alice'),
              id: M.regex(b64url, params.userId),
            },
            challenge: M.regex(b64url, params.challenge),
            pubKeyCredParams: M.atLeastOneLike({
              type: M.string('public-key'),
              alg: M.integer(-7),
            }),
            timeout: M.integer(300000),
            authenticatorSelection: {
              residentKey: M.string('required'),
            },
            extensions: { credProps: M.boolean(true) },
          },
        });
      });

    await interaction.executeTest(async (mockServer) => {
      const options = await createAuthApi({
        baseUrl: mockServer.url,
      }).registerStart('Alice');

      expect(options).toMatchObject({
        challenge: params.challenge,
        rp: { id: params.rpId },
        user: { name: 'Alice', id: params.userId },
      });
    });
  });

  it('registerFinish sends the attestation of the current session', async () => {
    const provider = newProvider();

    const interaction = provider
      .addInteraction()
      .given('a registration session exists', { sessionId: REG_SESSION })
      .uponReceiving('a request to finish registration with an attestation')
      .withRequest('POST', '/api/passkey/registerFinish', (b) => {
        b.headers({
          'Content-Type': 'application/json',
          Cookie: `sid=${REG_SESSION}`,
        });
        b.jsonBody(attestation);
      })
      .willRespondWith(200, (b) => {
        b.headers({
          'Content-Type': 'application/json',
          'Set-Cookie': sessionCookie(REG_SESSION),
        });
        b.jsonBody(M.string('Registration Success'));
      });

    await interaction.executeTest(async (mockServer) => {
      const api = apiWithSession(mockServer.url, REG_SESSION);
      await expect(api.registerFinish(attestation)).resolves.toBeUndefined();
    });
  });

  it('loginStart returns the request options', async () => {
    const provider = newProvider();

    const interaction = provider
      .addInteraction()
      .given('the auth service is available')
      .uponReceiving('a request to start login')
      .withRequest('POST', '/api/passkey/loginStart')
      .willRespondWith(200, (b) => {
        b.headers({
          'Content-Type': 'application/json',
          'Set-Cookie': sessionCookie(LOGIN_SESSION),
        });
        b.jsonBody({
          publicKey: {
            challenge: M.regex(b64url, params.challenge),
            timeout: M.integer(300000),
            rpId: M.regex(/^[a-z0-9.-]+$/, params.rpId),
          },
        });
      });

    await interaction.executeTest(async (mockServer) => {
      const options = await createAuthApi({
        baseUrl: mockServer.url,
      }).loginStart();

      expect(options).toMatchObject({
        challenge: params.challenge,
        rpId: params.rpId,
      });
    });
  });

  it('loginFinish sends the assertion of the current session', async () => {
    const provider = newProvider();

    const interaction = provider
      .addInteraction()
      .given('a login session and a user with a passkey exist', {
        sessionId: LOGIN_SESSION,
      })
      .uponReceiving('a request to finish login with an assertion')
      .withRequest('POST', '/api/passkey/loginFinish', (b) => {
        b.headers({
          'Content-Type': 'application/json',
          Cookie: `sid=${LOGIN_SESSION}`,
        });
        b.jsonBody(assertion);
      })
      .willRespondWith(200, (b) => {
        b.headers({
          'Content-Type': 'application/json',
          'Set-Cookie': sessionCookie(LOGIN_SESSION),
        });
        b.jsonBody(M.string('Login Success'));
      });

    await interaction.executeTest(async (mockServer) => {
      const api = apiWithSession(mockServer.url, LOGIN_SESSION);
      await expect(api.loginFinish(assertion)).resolves.toBeUndefined();
    });
  });

  it('logout sends the session and gets it cleared', async () => {
    const provider = newProvider();

    const interaction = provider
      .addInteraction()
      .given('a logged in session exists', { sessionId: LOGIN_SESSION })
      .uponReceiving('a request to log out')
      .withRequest('POST', '/api/logout', (b) => {
        b.headers({ Cookie: `sid=${LOGIN_SESSION}` });
      })
      .willRespondWith(204, (b) => {
        b.headers({ 'Set-Cookie': expiredSessionCookie() });
      });

    await interaction.executeTest(async (mockServer) => {
      const api = apiWithSession(mockServer.url, LOGIN_SESSION);
      await expect(api.logout()).resolves.toBeUndefined();
    });
  });
});
