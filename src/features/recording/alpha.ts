/** Check the decoded export, since MIME support alone does not guarantee alpha. */
export async function hasTransparentCorners(blob: Blob): Promise<boolean> {
  const video = document.createElement('video');
  const sample = document.createElement('canvas');
  sample.width = 5;
  sample.height = 1;
  const context = sample.getContext('2d');
  if (!context) return false;
  const url = URL.createObjectURL(blob);
  try {
    return await new Promise<boolean>((resolve) => {
      const finish = (valid: boolean) => {
        clearTimeout(timeout);
        resolve(valid);
      };
      const timeout = setTimeout(() => finish(false), 5000);
      video.onerror = () => finish(false);
      video.onloadedmetadata = () => {
        const time = Math.min(0.1, video.duration / 2);
        if (time > 0) video.currentTime = time;
        else finish(false);
      };
      video.onseeked = () => {
        try {
          const right = video.videoWidth - 1;
          const bottom = video.videoHeight - 1;
          const points = [
            [0, 0],
            [right, 0],
            [0, bottom],
            [right, bottom],
            [Math.floor(right / 2), Math.floor(bottom / 2)],
          ];
          points.forEach(([x, y], index) => context.drawImage(video, x, y, 1, 1, index, 0, 1, 1));
          const pixels = context.getImageData(0, 0, 5, 1).data;
          finish([3, 7, 11, 15].every((index) => pixels[index] < 16) && pixels[19] > 240);
        } catch {
          finish(false);
        }
      };
      video.preload = 'auto';
      video.src = url;
    });
  } finally {
    video.onloadedmetadata = video.onseeked = video.onerror = null;
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  }
}
