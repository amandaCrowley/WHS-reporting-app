import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isImageHash,
  validateImageFiles,
} from '../src/imageValidation.js';

const onePixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

const imageFile = (buffer = onePixelPng) => ({
  buffer,
  size: buffer.length,
  mimetype: 'image/png',
});

test('image validation identifies supported image content and hashes it', async () => {
  const [validated] = await validateImageFiles([imageFile()]);

  assert.equal(validated.detectedType.ext, 'png');
  assert.match(validated.hash, /^[a-f0-9]{64}$/);
  assert.equal(isImageHash(validated.hash), true);
});

test('image validation rejects duplicate image content', async () => {
  await assert.rejects(
    validateImageFiles([imageFile(), imageFile()]),
    /same image cannot be attached more than once/i,
  );
});

test('image validation rejects content that only claims to be an image', async () => {
  await assert.rejects(
    validateImageFiles([imageFile(Buffer.from('not an image'))]),
    /valid JPG, PNG, GIF and WEBP/i,
  );
});
