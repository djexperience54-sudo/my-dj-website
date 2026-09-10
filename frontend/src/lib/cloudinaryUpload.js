import { apiUrl } from './api'
import { parseBlob, selectCover } from 'music-metadata'

const maxFileSize = 400 * 1024 * 1024
const signatureTimeoutMs = 30000

const allowedMimeTypes = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  video: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/ogg', 'audio/flac', 'audio/webm', 'audio/m4a']
}

export function getDownloadUrl(mediaUrl, title) {
  if (!mediaUrl) {
    return ''
  }

  const fileName = title
    .trim()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'mixtape'

  return mediaUrl.replace('/upload/', `/upload/fl_attachment:${fileName}/`)
}

function formatMegabytes(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return 'calculating time'
  }

  if (seconds < 60) {
    return `${Math.ceil(seconds)}s left`
  }

  return `${Math.ceil(seconds / 60)}m left`
}

export async function extractEmbeddedArtwork(audioFile) {
  if (!audioFile) {
    return null
  }

  const metadata = await parseBlob(audioFile, { duration: false })
  const cover = selectCover(metadata.common.picture)

  if (!cover) {
    return null
  }

  return new File([cover.data], 'embedded-artwork', { type: cover.format })
}

export async function uploadToCloudinary(file, folder, resourceType, accessToken, onStatus, onProgress) {
  if (!file) {
    throw new Error('Choose a file before uploading.')
  }

  if (file.size > maxFileSize) {
    throw new Error('Files must be 400 MB or smaller.')
  }

  const extension = (file.name || '').split('.').pop()?.toLowerCase() || ''
  const mimeType = (file.type || '').toLowerCase()
  const allowed = allowedMimeTypes[resourceType] || []
  const extensionPermitted = resourceType === 'image'
    ? ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension)
    : ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'webm', 'mp4', 'mpeg', 'x-m4a'].includes(extension)

  const isAudioResource = resourceType === 'video'
  const acceptsAudioFallback = isAudioResource && (mimeType.startsWith('audio/') || extensionPermitted)

  if (allowed.length > 0 && !allowed.includes(mimeType) && !extensionPermitted && !acceptsAudioFallback) {
    const fileType = resourceType === 'image' ? 'JPG, PNG, GIF or WebP image' : 'MP3, WAV, M4A, AAC, OGG, FLAC or other common audio formats'
    throw new Error(`Choose a supported ${fileType}.`)
  }

  onStatus?.('Preparing secure upload...')
  const signatureController = new AbortController()
  const signatureTimer = window.setTimeout(() => signatureController.abort(), signatureTimeoutMs)

  let signatureResponse
  try {
    signatureResponse = await fetch(apiUrl('/api/media/signature'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ folder, resourceType }),
      signal: signatureController.signal
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('The upload service did not respond. Please try again.', { cause: error })
    }
    throw error
  } finally {
    window.clearTimeout(signatureTimer)
  }

  const signatureResult = await signatureResponse.json()

  if (!signatureResponse.ok) {
    throw new Error(signatureResult.error || 'Could not prepare the media upload.')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', signatureResult.data.apiKey)
  formData.append('timestamp', signatureResult.data.timestamp)
  formData.append('signature', signatureResult.data.signature)
  formData.append('folder', signatureResult.data.folder)

  onStatus?.(`Uploading ${resourceType === 'image' ? 'artwork' : 'audio'}...`)
  const uploadStartedAt = performance.now()
  const uploadResult = await new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('POST', `https://api.cloudinary.com/v1_1/${signatureResult.data.cloudName}/${resourceType}/upload`)
    request.responseType = 'json'

    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100)
        const elapsedSeconds = (performance.now() - uploadStartedAt) / 1000
        const speedBytesPerSecond = elapsedSeconds > 0 ? event.loaded / elapsedSeconds : 0
        const remainingSeconds = speedBytesPerSecond > 0
          ? (event.total - event.loaded) / speedBytesPerSecond
          : Number.NaN
        onProgress?.(progress)
        onStatus?.(`Uploading ${resourceType === 'image' ? 'artwork' : 'audio'}... ${progress}% - ${formatMegabytes(event.loaded)} at ${(speedBytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s, ${formatDuration(remainingSeconds)}`)
      }
    })
    request.addEventListener('load', () => {
      if (request.status >= 200 && request.status < 300) {
        resolve(request.response)
        return
      }

      reject(new Error(request.response?.error?.message || 'The media upload failed.'))
    })
    request.addEventListener('error', () => reject(new Error('The media upload failed. Check your connection and try again.')))
    request.addEventListener('abort', () => reject(new Error('The media upload was cancelled.')))
    request.send(formData)
  })

  return uploadResult.secure_url
}
