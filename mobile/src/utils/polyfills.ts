import { Buffer } from 'buffer';

declare const global: typeof globalThis & { Buffer?: typeof Buffer };

if (!global.Buffer) {
  global.Buffer = Buffer;
}
