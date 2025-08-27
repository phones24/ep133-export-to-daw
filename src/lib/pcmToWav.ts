function createWavHeader(
  dataLength: number,
  sampleRate: number,
  channels: number,
  bitDepth: number,
): Uint8Array {
  const header = new Uint8Array(44);
  const view = new DataView(header.buffer);

  // RIFF header
  header.set([0x52, 0x49, 0x46, 0x46], 0); // "RIFF"
  view.setUint32(4, 36 + dataLength, true); // File size - 8 bytes
  header.set([0x57, 0x41, 0x56, 0x45], 8); // "WAVE"

  // Format chunk
  header.set([0x66, 0x6d, 0x74, 0x20], 12); // "fmt "
  view.setUint32(16, 16, true); // Format chunk size
  view.setUint16(20, 1, true); // Audio format (PCM)
  view.setUint16(22, channels, true); // Number of channels
  view.setUint32(24, sampleRate, true); // Sample rate
  view.setUint32(28, sampleRate * channels * (bitDepth / 8), true); // Byte rate
  view.setUint16(32, channels * (bitDepth / 8), true); // Block align
  view.setUint16(34, bitDepth, true); // Bits per sample

  // Data chunk
  header.set([0x64, 0x61, 0x74, 0x61], 36); // "data"
  view.setUint32(40, dataLength, true); // Data size

  return header;
}

export function pcmToWavBlob(
  pcmData: Uint8Array,
  sampleRate: number = 44100,
  bitDepth: number = 16,
  channels: number = 1,
): Blob {
  const header = createWavHeader(pcmData.length, sampleRate, channels, bitDepth);

  const wavData = new Uint8Array(header.length + pcmData.length);
  wavData.set(header, 0);
  wavData.set(pcmData, header.length);

  return new Blob([wavData], { type: 'audio/wav' });
}

export function pcmToWavArray(
  pcmData: Uint8Array,
  sampleRate: number = 44100,
  bitDepth: number = 16,
  channels: number = 1,
): Uint8Array {
  const header = createWavHeader(pcmData.length, sampleRate, channels, bitDepth);
  const wavData = new Uint8Array(header.length + pcmData.length);
  wavData.set(header, 0);
  wavData.set(pcmData, header.length);
  return wavData;
}
