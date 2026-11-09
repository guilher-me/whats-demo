declare module 'gifenc' {
  type Palette = number[][];

  export function quantize(pixels: Uint8ClampedArray, maxColors: number): Palette;
  export function applyPalette(pixels: Uint8ClampedArray, palette: Palette): Uint8Array;
  export function GIFEncoder(): {
    writeFrame(
      pixels: Uint8Array,
      width: number,
      height: number,
      options: { palette: Palette; delay: number; transparent: boolean },
    ): void;
    finish(): void;
    bytes(): Uint8Array<ArrayBuffer>;
  };
}
