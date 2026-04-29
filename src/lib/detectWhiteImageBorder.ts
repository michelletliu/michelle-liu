const detectionCache = new Map<string, Promise<boolean>>();

type EdgeCounts = {
  white: number;
  total: number;
};

const isNearWhite = (r: number, g: number, b: number, a: number) => {
  if (a < 16) return false;

  const maxChannel = Math.max(r, g, b);
  const minChannel = Math.min(r, g, b);

  return maxChannel >= 238 && minChannel >= 228 && maxChannel - minChannel <= 32;
};

const countWhitePixels = (
  data: Uint8ClampedArray,
  width: number,
  points: Array<[number, number]>,
): EdgeCounts =>
  points.reduce<EdgeCounts>(
    (counts, [x, y]) => {
      const index = (y * width + x) * 4;
      const isWhite = isNearWhite(data[index], data[index + 1], data[index + 2], data[index + 3]);

      return {
        white: counts.white + (isWhite ? 1 : 0),
        total: counts.total + 1,
      };
    },
    {white: 0, total: 0},
  );

const edgeRatio = ({white, total}: EdgeCounts) => (total > 0 ? white / total : 0);

const inspectLoadedImage = (image: HTMLImageElement) => {
  const width = image.naturalWidth;
  const height = image.naturalHeight;

  if (width === 0 || height === 0) return false;

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", {willReadFrequently: true});

  if (!context) return false;

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  const pixels = context.getImageData(0, 0, width, height).data;
  const edgeThickness = Math.max(2, Math.min(12, Math.round(Math.min(width, height) * 0.04)));
  const step = Math.max(1, Math.floor(Math.min(width, height) / 90));

  const top: Array<[number, number]> = [];
  const right: Array<[number, number]> = [];
  const bottom: Array<[number, number]> = [];
  const left: Array<[number, number]> = [];

  for (let offset = 0; offset < edgeThickness; offset += 1) {
    for (let x = 0; x < width; x += step) {
      top.push([x, offset]);
      bottom.push([x, height - 1 - offset]);
    }

    for (let y = 0; y < height; y += step) {
      left.push([offset, y]);
      right.push([width - 1 - offset, y]);
    }
  }

  const edgeRatios = [top, right, bottom, left].map((points) =>
    edgeRatio(countWhitePixels(pixels, width, points)),
  );
  const whiteEdges = edgeRatios.filter((ratio) => ratio >= 0.55).length;
  const averageEdgeRatio = edgeRatios.reduce((total, ratio) => total + ratio, 0) / edgeRatios.length;

  return whiteEdges >= 2 && averageEdgeRatio >= 0.42;
};

export function detectWhiteImageBorder(src: string) {
  const cached = detectionCache.get(src);

  if (cached) return cached;

  const detection = new Promise<boolean>((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    const image = new Image();

    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        resolve(inspectLoadedImage(image));
      } catch {
        resolve(false);
      }
    };
    image.onerror = () => resolve(false);
    image.src = src;
  });

  detectionCache.set(src, detection);
  return detection;
}
