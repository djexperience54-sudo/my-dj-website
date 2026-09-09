import { apiUrl } from './api'
const maxFileSize = 400 * 1024 * 1024

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

export async function uploadToCloudinary(file, folder, resourceType, accessToken) {
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

  const signatureResponse = await fetch(apiUrl('/api/media/signature'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ folder, resourceType })
  })

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

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${signatureResult.data.cloudName}/${resourceType}/upload`,
    { method: 'POST', body: formData }
  )
  const uploadResult = await uploadResponse.json()

  if (!uploadResponse.ok) {
    throw new Error(uploadResult.error?.message || 'The media upload failed.')
  }

  return uploadResult.secure_url
}
