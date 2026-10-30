// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { sanitizeAvatar, sanitizePhotoFile } from '../src/core/images/sanitize';
import { prepareProjectImages } from '../src/core/images/sanitize';
import { createDefaultProject } from '../src/core/defaults';
const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==';
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
function decoder() {
  const close = vi.fn(),
    drawImage = vi.fn();
  const decode = vi.fn().mockResolvedValue({ width: 1024, height: 512, close });
  vi.stubGlobal('createImageBitmap', decode);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage,
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(PNG);
  return { decode, close, drawImage };
}
it('checks real bytes, rewrites pixels, discards trailing payload and deduplicates processing', async () => {
  const { decode, close, drawImage } = decoder();
  const input =
    'data:image/png;base64,' + btoa(atob(PNG.split(',')[1]) + '<script>malicious()</script>');
  const [first, second] = await Promise.all([sanitizeAvatar(input), sanitizeAvatar(input)]);
  expect(first).toBe(PNG);
  expect(second).toBe(PNG);
  expect(decode).toHaveBeenCalledTimes(1);
  expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 512, 256);
  expect(close).toHaveBeenCalledTimes(1);
  expect(atob(first.split(',')[1])).not.toContain('<script>');
});
it('rejects MIME spoofing, huge headers and unsupported uploads before browser decoding', async () => {
  const { decode } = decoder();
  await expect(sanitizeAvatar(PNG.replace('image/png', 'image/jpeg'))).rejects.toThrow();
  await expect(
    sanitizePhotoFile(new File(['<svg/>'], 'photo.png', { type: 'image/svg+xml' })),
  ).rejects.toThrow();
  const file = {
    size: 2 * 1024 * 1024 + 1,
    type: 'image/png',
    arrayBuffer: vi.fn(),
  } as unknown as File;
  await expect(sanitizePhotoFile(file)).rejects.toThrow();
  expect(file.arrayBuffer).not.toHaveBeenCalled();
  expect(decode).not.toHaveBeenCalled();
});
it('rejects a browser decoding failure and retains the project without the bad photo', async () => {
  const { decode } = decoder();
  decode.mockRejectedValue(new Error('corrupt pixels'));
  const project = createDefaultProject();
  project.contact.avatar =
    'data:image/png;base64,' + btoa(atob(PNG.split(',')[1]) + 'different-corrupt');
  const safe = await prepareProjectImages(project);
  expect(safe.contact.avatar).toBe('');
  expect(safe.steps).toEqual(project.steps);
});
it('times out slow decoders and closes a bitmap that arrives after the deadline', async () => {
  vi.useFakeTimers();
  const { decode, close } = decoder();
  let finish!: (bitmap: unknown) => void;
  decode.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const input = 'data:image/png;base64,' + btoa(atob(PNG.split(',')[1]) + 'slow');
  const result = sanitizeAvatar(input);
  const assertion = expect(result).rejects.toThrow();
  // file-type uses asynchronous tokenizer reads before starting the native decoder.
  await vi.waitFor(() => expect(decode).toHaveBeenCalled());
  await vi.advanceTimersByTimeAsync(8001);
  await assertion;
  finish({ width: 1, height: 1, close });
  await Promise.resolve();
  expect(close).toHaveBeenCalledTimes(1);
});
