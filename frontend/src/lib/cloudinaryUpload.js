import { apiUrl } from './api'
const maxFileSize = 400 * 1024 * 1024

const allowedMimeTypes = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
  video: ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/ogg']
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

  if (allowedMimeTypes[resourceType] && !allowedMimeTypes[resourceType].includes(file.type)) {
    const fileType = resourceType === 'image' ? 'JPG, PNG or WebP image' : 'MP3, WAV, M4A, AAC or OGG audio'
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
