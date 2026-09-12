const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function getAuthenticatedUser(accessToken) {
  const { data, error } = await supabase.auth.getUser(accessToken)

  if (error) {
    throw error
  }

  return data.user
}

async function getRows(table, columns, orderColumn) {
  const { data, error } = await supabase.from(table).select(columns).order(orderColumn, { ascending: true })

  if (error) {
    throw error
  }

  return data
}

function getMixtapes() {
  return getRows('mixtapes', 'id, genre, title, artwork, description, audio_url', 'title')
}

function getEvents() {
  return getRows('events', 'id, month, day, title, details', 'sort_order')
}

function getGalleryItems() {
  return getRows('gallery_items', 'id, src, alt', 'sort_order')
}

async function getPublicSiteContent() {
  const [mixtapes, events, gallery, settingsResult, videos] = await Promise.all([
    getMixtapes(),
    getEvents(),
    getGalleryItems(),
    supabase.from('site_settings').select('*').limit(1).maybeSingle(),
    supabase.from('site_videos').select('id, title, url, type, sort_order').order('sort_order', { ascending: true }).limit(1)
  ])

  if (settingsResult.error) {
    throw settingsResult.error
  }

  if (videos.error) {
    throw videos.error
  }

  return {
    mixtapes,
    events,
    gallery,
    siteSettings: settingsResult.data,
    featuredVideo: videos.data?.[0] || null
  }
}

function formatSupabaseError(error, context) {
  const message = error && error.message ? error.message : 'A database error occurred.'

  if (message.includes('Could not find the table') || message.includes('does not exist')) {
    return `${context} is temporarily unavailable because the Supabase table is not ready yet. Run the SQL schema in backend/supabase-schema.sql and then try again.`
  }

  if (message.includes('row-level security') || message.includes('permission denied for table')) {
    return `${context} is temporarily unavailable because the Supabase permissions are not configured yet.`
  }

  return message
}

async function createBooking(booking) {
  const { data, error } = await supabase.from('bookings').insert(booking).select().single()

  if (error) {
    throw new Error(formatSupabaseError(error, 'Booking submission'))
  }

  return data
}

async function createComment(comment) {
  const { data, error } = await supabase.from('comments').insert(comment).select().single()

  if (error) {
    throw new Error(formatSupabaseError(error, 'Comment submission'))
  }

  return data
}

module.exports = { createBooking, createComment, formatSupabaseError, getAuthenticatedUser, getEvents, getGalleryItems, getMixtapes, getPublicSiteContent }
