const WHISPER_EXTENSIONS = [
  'flac',
  'm4a',
  'mp3',
  'mp4',
  'mpeg',
  'mpga',
  'oga',
  'ogg',
  'wav',
  'webm',
] as const

export type WhisperExtension = (typeof WHISPER_EXTENSIONS)[number]

function extensionFromMimeType(mimeType: string): WhisperExtension {
  const type = mimeType.toLowerCase()

  if (type.includes('webm')) return 'webm'
  if (type.includes('mp4') || type.includes('m4a') || type.includes('x-m4a')) {
    return 'm4a'
  }
  if (type.includes('mpeg') || type.includes('mp3')) return 'mp3'
  if (type.includes('ogg') || type.includes('oga')) return 'ogg'
  if (type.includes('wav')) return 'wav'
  if (type.includes('flac')) return 'flac'

  return 'webm'
}

function mimeTypeForExtension(extension: WhisperExtension): string {
  switch (extension) {
    case 'webm':
      return 'audio/webm'
    case 'm4a':
    case 'mp4':
      return 'audio/mp4'
    case 'mp3':
    case 'mpeg':
    case 'mpga':
      return 'audio/mpeg'
    case 'ogg':
    case 'oga':
      return 'audio/ogg'
    case 'wav':
      return 'audio/wav'
    case 'flac':
      return 'audio/flac'
  }
}

/** Detect container format from magic bytes when the browser omits MIME type. */
export function sniffWhisperExtension(
  bytes: Uint8Array,
  declaredMimeType = '',
): WhisperExtension {
  if (bytes.length >= 4) {
    if (
      bytes[0] === 0x1a &&
      bytes[1] === 0x45 &&
      bytes[2] === 0xdf &&
      bytes[3] === 0xa3
    ) {
      return 'webm'
    }

    if (
      bytes[0] === 0x4f &&
      bytes[1] === 0x67 &&
      bytes[2] === 0x67 &&
      bytes[3] === 0x53
    ) {
      return 'ogg'
    }

    if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46
    ) {
      return 'wav'
    }

    if (
      bytes.length >= 8 &&
      bytes[4] === 0x66 &&
      bytes[5] === 0x74 &&
      bytes[6] === 0x79 &&
      bytes[7] === 0x70
    ) {
      return 'm4a'
    }

    if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
      return 'mp3'
    }
  }

  if (declaredMimeType.trim()) {
    return extensionFromMimeType(declaredMimeType)
  }

  return 'webm'
}

export function whisperFilename(
  bytes: Uint8Array,
  declaredMimeType = '',
): string {
  const extension = sniffWhisperExtension(bytes, declaredMimeType)
  return `recording.${extension}`
}

export function whisperMimeType(
  bytes: Uint8Array,
  declaredMimeType = '',
): string {
  const extension = sniffWhisperExtension(bytes, declaredMimeType)
  return mimeTypeForExtension(extension)
}

export async function toWhisperUploadFile(blob: Blob): Promise<File> {
  const buffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  if (bytes.length === 0) {
    throw new Error('Recording was empty. Try speaking for at least one second.')
  }

  const filename = whisperFilename(bytes, blob.type)
  const type = whisperMimeType(bytes, blob.type)

  return new File([buffer], filename, { type })
}

export function pickMediaRecorderMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm'

  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ]

  for (const candidate of candidates) {
    if (MediaRecorder.isTypeSupported(candidate)) {
      return candidate
    }
  }

  return 'audio/webm'
}
