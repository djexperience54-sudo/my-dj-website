require('dotenv').config()

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const { createBooking, createComment, getAuthenticatedUser, getEvents, getGalleryItems, getMixtapes, getPublicSiteContent, getSitemapContent } = require('./database')
const { createUploadSignature, isConfigured: isCloudinaryConfigured } = require('./cloudinary')
const { sendBookingEmail } = require('./email')
const { sanitizeBookingPayload, sanitizeCommentPayload } = require('./validation')

const app = express()
const port = process.env.PORT || 3000
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://intldjexperience.com',
  'https://www.intldjexperience.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173'
].filter(Boolean)

app.use(express.json({ limit: '1mb' }))
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
      return
    }

    callback(new Error('Origin not allowed by CORS'))
  },
  credentials: true
}))
app.use(helmet())

function asyncRoute(handler) {
  return (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next)
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

app.get('/', (request, response) => {
  response.json({
    name: "INT'L DJ Experience API",
    status: 'ok',
    message: 'Backend is running. Use /api/health for the health check.'
  })
})

app.get('/api/health', (request, response) => {
  response.json({ status: 'ok' })
})

app.get('/api/mixtapes', asyncRoute(async (request, response) => {
  response.json({ data: await getMixtapes() })
}))

app.get('/api/events', asyncRoute(async (request, response) => {
  response.json({ data: await getEvents() })
}))

app.get('/api/gallery', asyncRoute(async (request, response) => {
  response.json({ data: await getGalleryItems() })
}))

app.get('/api/site-content', asyncRoute(async (request, response) => {
  response.json({ data: await getPublicSiteContent() })
}))

app.get('/sitemap.xml', asyncRoute(async (request, response) => {
  const { mixtapes } = await getSitemapContent()
  const urls = [
    'https://intldjexperience.com/',
    ...mixtapes.map((item) => `https://intldjexperience.com/mixes/${encodeURIComponent(item.id)}`),
  ]
  const lastModified = mixtapes
    .map((item) => item.created_at)
    .filter(Boolean)
    .sort()
    .pop()
  const entries = urls.map((url) => `  <url><loc>${escapeXml(url)}</loc>${lastModified ? `<lastmod>${new Date(lastModified).toISOString()}</lastmod>` : ''}</url>`).join('\n')
  response.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`)
}))

app.post('/api/bookings', asyncRoute(async (request, response) => {
  try {
    const payload = sanitizeBookingPayload(request.body)
    const booking = await createBooking({
      name: payload.name,
      email: payload.email,
      event_type: payload.eventType,
      message: payload.message
    })

    const recipient = process.env.SMTP_TO || 'djexperience54@gmail.com'
    const emailPayload = {
      to: recipient,
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'djexperience54@gmail.com',
      name: payload.name,
      email: payload.email,
      eventType: payload.eventType,
      message: payload.message
    }

    try {
      await sendBookingEmail(emailPayload)
    } catch (emailError) {
      console.error('Booking email delivery failed:', emailError.message)
      return response.status(202).json({
        success: true,
        message: 'Your booking request was saved successfully, but email delivery is not active yet. Add the Gmail SMTP app password in Render to enable booking notifications.',
        data: booking
      })
    }

    response.status(201).json({
      success: true,
      message: 'Your booking request has been sent successfully. I will reply within 24 hours.',
      data: booking
    })
  } catch (error) {
    response.status(400).json({ error: error.message })
  }
}))

app.post('/api/comments', asyncRoute(async (request, response) => {
  try {
    const payload = sanitizeCommentPayload(request.body)
    const comment = await createComment(payload)

    response.status(201).json({
      success: true,
      message: 'Your comment has been posted successfully.',
      data: comment
    })
  } catch (error) {
    response.status(400).json({
      error: error.message || 'Your comment could not be posted right now. Please try again in a moment.'
    })
  }
}))

app.post('/api/media/signature', asyncRoute(async (request, response) => {
  const authorization = request.headers.authorization || ''
  const accessToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''

  if (!accessToken) {
    return response.status(401).json({ error: 'A signed-in admin is required.' })
  }

  if (!isCloudinaryConfigured()) {
    return response.status(503).json({ error: 'Cloudinary is not configured on the backend yet.' })
  }

  try {
    await getAuthenticatedUser(accessToken)
  } catch (authenticationError) {
    return response.status(401).json({ error: 'The admin session is invalid or expired.' })
  }

  const resourceType = ['image', 'video', 'raw'].includes(request.body.resourceType) ? request.body.resourceType : 'image'
  const folder = request.body.folder === 'gallery' ? 'intl-dj/gallery' : 'intl-dj/mixtapes'
  response.json({ data: createUploadSignature({ folder, resourceType }) })
}))

app.use((error, request, response, next) => {
  console.error(error)
  response.status(500).json({ error: 'The server could not complete that request.' })
})

app.listen(port, () => {
  console.log(`DJ website API listening on http://localhost:${port}`)
})
