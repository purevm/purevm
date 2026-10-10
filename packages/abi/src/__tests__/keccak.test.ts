import { expect, test } from "vitest";
// keccak256 wraps @noble/hashes keccak_256; viem (a devDependency) wraps the same library, and the
// known-answer vectors below come from neither.
import { hexToBytes, keccak256 as viemKeccak256 } from "viem";
import { keccak256 } from "../libs/keccak.ts";
import { createRandom } from "../../tests/random.ts";

const RATE = 136;

test("known answers: viem's own vectors and the standard empty and 'abc' hashes", () => {
  const vectors: [Uint8Array, string][] = [
    [
      hexToBytes("0xdeadbeef"),
      "0xd4fd4e189132273036449fc9e11198c739161b4c0116a9a2dccdfa1c492006f1",
    ],
    [
      new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]),
      "0x3ea2f1d0abf3fc66cf29eebb70cbd4e7fe762ef8a09bcc06c8edf641230afec0",
    ],
    [new Uint8Array(), "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"],
    [
      new TextEncoder().encode("abc"),
      "0x4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45",
    ],
  ];
  for (const [input, hash] of vectors) expect(keccak256(input)).toBe(hash);
});

test("noble-hashes' Keccak-256 vectors: the NIST messages, hashed by js-sha3", () => {
  // From noble-hashes test/hashes.test.ts (KECCAK256.nist): a third implementation, not viem.
  const encoder = new TextEncoder();
  const vectors: [Uint8Array, string][] = [
    [encoder.encode("abc"), "4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45"],
    [encoder.encode(""), "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"],
    [
      encoder.encode("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"),
      "45d3b367a6904e6e8d502ee04999a7c27647f91fa845d456525fd352ae3d7371",
    ],
    [
      encoder.encode(
        "abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu",
      ),
      "f519747ed599024f3882238e5ab43960132572b7345fbeb9a90769dafd21ad67",
    ],
    [
      new Uint8Array(1_000_000).fill(0x61),
      "fadae6b49f129bbb812be8407b7b2894f34aecf6dbd1f9b0f0c7e9853098fc96",
    ],
  ];
  for (const [input, hash] of vectors) expect(keccak256(input)).toBe(`0x${hash}`);
});

test("every length from 0 to 5 blocks matches viem, both padding shapes included", () => {
  // Lengths ≡ 135 (mod 136) put 0x01 and 0x80 on the same byte (0x81); others use two bytes.
  const random = createRandom(1);
  for (let length = 0; length <= 5 * RATE + 20; length++) {
    const input = hexToBytes(random.hex(length));
    expect(keccak256(input), `length ${length}`).toBe(viemKeccak256(input));
  }
});

test("every single byte value matches viem", () => {
  for (let byte = 0; byte < 256; byte++) {
    const input = new Uint8Array([byte]);
    expect(keccak256(input), `byte ${byte}`).toBe(viemKeccak256(input));
  }
});

test("a large input spanning hundreds of blocks matches viem", () => {
  const input = hexToBytes(createRandom(2).hex(100_000));
  expect(keccak256(input)).toBe(viemKeccak256(input));
});

test("the output is 0x plus 64 lowercase hex digits, like viem", () => {
  const random = createRandom(3);
  for (let i = 0; i < 50; i++) {
    const hash = keccak256(hexToBytes(random.hex(i * 7)));
    expect(hash).toMatch(/^0x[0-9a-f]{64}$/);
  }
});
