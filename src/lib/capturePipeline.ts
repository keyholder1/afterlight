// Capture → resize/compress → thumbnail → blurhash → stable local files.
// See docs/06-technical-architecture.md § Image upload.

import { Image } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { File, Directory, Paths } from 'expo-file-system';
import { Blurhash } from 'react-native-blurhash';

const MAX_LONG_EDGE = 2048;
const THUMB_WIDTH = 320;
const ORIGINAL_QUALITY = 0.82;
const THUMB_QUALITY = 0.7;

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

function memoriesDir(): Directory {
  const dir = new Directory(Paths.document, 'memories');
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

export type ProcessedCapture = {
  localUri: string;
  localThumbUri: string;
  width: number;
  height: number;
  blurhash: string;
};

export async function processCapture(rawUri: string, clientId: string): Promise<ProcessedCapture> {
  const original = await getImageSize(rawUri);
  const isLandscape = original.width >= original.height;
  const longEdgeResize = isLandscape ? { width: MAX_LONG_EDGE } : { height: MAX_LONG_EDGE };

  const full = await manipulateAsync(rawUri, [{ resize: longEdgeResize }], {
    compress: ORIGINAL_QUALITY,
    format: SaveFormat.JPEG,
  });
  const thumb = await manipulateAsync(rawUri, [{ resize: { width: THUMB_WIDTH } }], {
    compress: THUMB_QUALITY,
    format: SaveFormat.JPEG,
  });

  const dir = memoriesDir();
  const fullDest = new File(dir, `${clientId}.jpg`);
  const thumbDest = new File(dir, `${clientId}_thumb.jpg`);

  await new File(full.uri).move(fullDest, { overwrite: true });
  await new File(thumb.uri).move(thumbDest, { overwrite: true });

  const blurhash = await Blurhash.encode(thumbDest.uri, 4, 3);

  return {
    localUri: fullDest.uri,
    localThumbUri: thumbDest.uri,
    width: full.width,
    height: full.height,
    blurhash,
  };
}
