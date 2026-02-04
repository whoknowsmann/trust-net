# TrustNet Mobile (Expo + Solana Mobile)

This is the Expo-managed React Native app for the TrustNet Solana Mobile MVP.

## Requirements

- Node.js + npm/yarn/pnpm
- Android Studio + Android SDK
- A Solana Mobile / Seeker device for Mobile Wallet Adapter (MWA) testing

## Install

```sh
cd mobile
npm install
```

If you use yarn or pnpm, swap the install command accordingly.

## Run (Android)

```sh
npm run android
```

This uses `expo run:android` for local development.

## Wallet (MWA)

This app uses the Solana Mobile Wallet Adapter (MWA). You must:

- Install a compatible wallet on the device
- Authorize the app when prompted

## SDK Imports

The TrustNet SDK is consumed from `../packages/sdk` via a file dependency:

```json
"@trustnet/sdk": "file:../packages/sdk"
```

If the SDK package name or exports differ, update `src/services/trustnet.ts`.

## Notes

- Polyfills live in `src/utils/polyfills.ts` and are loaded first in `index.js`.
- The MWA integration lives in `src/hooks/useWallet.ts`.
