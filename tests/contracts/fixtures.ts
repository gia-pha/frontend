// Fixed WebAuthn fixtures for the contract tests. The consumer sends the
// attestation/assertion as the finish request bodies, and the auth provider
// seeds the matching challenge and credential public key when it verifies the
// pact, so these values are only valid together with the provider's copy.
// They are cryptographically consistent: the assertion signature was produced
// by the EC P-256 key whose COSE public key is `params.cosePublicKey`.
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/browser';

export const params = {
  rpId: 'localhost',
  origin: 'http://localhost:8083',
  challenge: 'ASNFZ4mrze8BI0VniavN7w',
  userId: 'cGFjdHVzZXIwMDAwMDAwMQ',
  credentialId: 'cGFjdGNyZWQwMDAwMDAwMQ',
  cosePublicKey:
    'pQECAyYgAiFYIFnu-2DBPFhhqDQLPew9_DAZkhZ2WJ4uVjI4_-jJDUfmIlggq1Y0ltMEM7sP6nzAJXLY8GtcI2snSIK3NqVdLdkPc1Y',
};

export const attestation: RegistrationResponseJSON = {
  id: 'cGFjdGNyZWQwMDAwMDAwMQ',
  rawId: 'cGFjdGNyZWQwMDAwMDAwMQ',
  type: 'public-key',
  response: {
    clientDataJSON:
      'eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiQVNORlo0bXJ6ZThCSTBWbmlhdk43dyIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODA4MyIsImNyb3NzT3JpZ2luIjpmYWxzZX0',
    attestationObject:
      'o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViUSZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2NFAAAAAAAAAAAAAAAAAAAAAAAAAAAAEHBhY3RjcmVkMDAwMDAwMDGlAQIDJiACIVggWe77YME8WGGoNAs97D38MBmSFnZYni5WMjj_6MkNR-YiWCCrVjSW0wQzuw_qfMAlctjwa1wjaydIgrc2pV0t2Q9zVg',
  },
  clientExtensionResults: {},
};

export const assertion: AuthenticationResponseJSON = {
  id: 'cGFjdGNyZWQwMDAwMDAwMQ',
  rawId: 'cGFjdGNyZWQwMDAwMDAwMQ',
  type: 'public-key',
  response: {
    clientDataJSON:
      'eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiQVNORlo0bXJ6ZThCSTBWbmlhdk43dyIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODA4MyIsImNyb3NzT3JpZ2luIjpmYWxzZX0',
    authenticatorData: 'SZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2MFAAAAAQ',
    signature:
      'MEQCIHtpzgNSBltsgNZFidk1vp8eeh7UZLNEpEtz4UdqoeaWAiAl52VfuD2ZhNz9KJlHe9Gaq19jjXSNLIwl4zcCrvMXUg',
    userHandle: 'cGFjdHVzZXIwMDAwMDAwMQ',
  },
  clientExtensionResults: {},
};
