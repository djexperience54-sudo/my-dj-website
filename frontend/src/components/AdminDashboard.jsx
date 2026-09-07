import { useEffect, useState } from 'react'
import { getSupabaseClient } from '../lib/supabaseClient'
import { uploadToCloudinary } from '../lib/cloudinaryUpload'

const contentTables = [
  { key: 'mixtapes', label: 'Mixtapes' },
  { key: 'events', label: 'Events' },
  { key: 'gallery_items', label: 'Gallery items' }
]

const emptyMixtape = {
  id: '',
  genre: '',
  title: '',
  artwork: '',
  description: '',
  audio_url: ''
}

const emptyEvent = {
  id: '',
  month: '',
  day: '',
  title: '',
  details: '',
  sort_order: 0
}

const emptyGalleryItem = {
  id: '',
  src: '',
  alt: '',
  sort_order: 0
}

function formatFileSize(bytes) {
  if (!bytes) {
    return ''
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function AdminDashboard({ user, onSignOut }) {
  const [counts, setCounts] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [mixtapes, setMixtapes] = useState([])
  const [mixtapeForm, setMixtapeForm] = useState(emptyMixtape)
  const [isSavingMixtape, setIsSavingMixtape] = useState(false)
  const [mixtapeStatus, setMixtapeStatus] = useState('')
  const [mixtapeArtworkFile, setMixtapeArtworkFile] = useState(null)
  const [mixtapeAudioFile, setMixtapeAudioFile] = useState(null)
  const [events, setEvents] = useState([])
  const [eventForm, setEventForm] = useState(emptyEvent)
  const [isSavingEvent, setIsSavingEvent] = useState(false)
  const [galleryItems, setGalleryItems] = useState([])
  const [galleryForm, setGalleryForm] = useState(emptyGalleryItem)
  const [isSavingGallery, setIsSavingGallery] = useState(false)
  const [galleryFile, setGalleryFile] = useState(null)
  const [bookings, setBookings] = useState([])

  useEffect(() => {
    async function loadOverview() {
      try {
        const results = await Promise.all(
          contentTables.map(async ({ key }) => {
            const { count, error: countError } = await getSupabaseClient()
              .from(key)
              .select('*', { count: 'exact', head: true })

            if (countError) {
              throw countError
            }

            return [key, count ?? 0]
          })
        )

        setCounts(Object.fromEntries(results))
        const { data: mixtapeRows, error: mixtapeError } = await getSupabaseClient()
          .from('mixtapes')
          .select('id, genre, title, artwork, description, audio_url')
          .order('title', { ascending: true })

        if (mixtapeError) {
          throw mixtapeError
        }

        setMixtapes(mixtapeRows)
        const { data: eventRows, error: eventError } = await getSupabaseClient()
          .from('events')
          .select('id, month, day, title, details, sort_order')
          .order('sort_order', { ascending: true })

        if (eventError) {
          throw eventError
        }

        setEvents(eventRows)
        const { data: galleryRows, error: galleryError } = await getSupabaseClient()
          .from('gallery_items')
          .select('id, src, alt, sort_order')
          .order('sort_order', { ascending: true })

        if (galleryError) {
          throw galleryError
        }

        setGalleryItems(galleryRows)
        const { data: bookingRows, error: bookingError } = await getSupabaseClient()
          .from('bookings')
          .select('id, name, email, event_type, message, status, created_at')
          .order('created_at', { ascending: false })

        if (bookingError) {
          throw bookingError
        }

        setBookings(bookingRows)
      } catch (overviewError) {
        setError(overviewError.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadOverview()
  }, [])

  async function handleSignOut() {
    await getSupabaseClient().auth.signOut()
    onSignOut()
  }

  function handleMixtapeChange(event) {
    const { name, value } = event.target
    setMixtapeForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  function editMixtape(mixtape) {
    setMixtapeForm({
      id: mixtape.id,
      genre: mixtape.genre,
      title: mixtape.title,
      artwork: mixtape.artwork,
      description: mixtape.description,
      audio_url: mixtape.audio_url || ''
    })
    setError('')
    setMixtapeStatus(`Editing ${mixtape.title}`)
    document.getElementById('mixtape-management-title')?.scrollIntoView({ behavior: 'smooth' })
  }

  function cancelMixtapeEdit() {
    setMixtapeForm(emptyMixtape)
    setMixtapeStatus('')
    setMixtapeArtworkFile(null)
    setMixtapeAudioFile(null)
  }

  async function handleMixtapeSubmit(event) {
    event.preventDefault()
    setError('')
    setMixtapeStatus('Uploading files and saving mixtape...')
    setIsSavingMixtape(true)

    try {
      const { data: sessionData } = await getSupabaseClient().auth.getSession()
      const accessToken = sessionData.session?.access_token

      if (!accessToken) {
        throw new Error('Your admin session has expired. Please sign in again.')
      }

      const artwork = mixtapeArtworkFile
        ? await uploadToCloudinary(mixtapeArtworkFile, 'mixtapes', 'image', accessToken)
        : mixtapeForm.artwork
      const audioUrl = mixtapeAudioFile
        ? await uploadToCloudinary(mixtapeAudioFile, 'mixtapes', 'video', accessToken)
        : mixtapeForm.audio_url || null
      const { data, error: saveError } = await getSupabaseClient()
        .from('mixtapes')
        .upsert({ ...mixtapeForm, artwork, audio_url: audioUrl })
        .select()
        .single()

      if (saveError) {
        throw saveError
      }

      setMixtapes((currentMixtapes) => {
        const withoutSaved = currentMixtapes.filter((mixtape) => mixtape.id !== data.id)
        const nextMixtapes = [...withoutSaved, data].sort((first, second) => first.title.localeCompare(second.title))
        setCounts((currentCounts) => ({ ...currentCounts, mixtapes: nextMixtapes.length }))
        return nextMixtapes
      })
      setMixtapeForm(emptyMixtape)
      setMixtapeArtworkFile(null)
      setMixtapeAudioFile(null)
      setMixtapeStatus('Mixtape saved successfully.')
    } catch (saveError) {
      setError(saveError.message)
      setMixtapeStatus(`Save failed: ${saveError.message}`)
    } finally {
      setIsSavingMixtape(false)
    }
  }

  async function handleMixtapeDelete(id) {
    setError('')

    if (!window.confirm('Delete this mixtape? This removes its database record from the public site.')) {
      return
    }

    const { error: deleteError } = await getSupabaseClient().from('mixtapes').delete().eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setMixtapes((currentMixtapes) => currentMixtapes.filter((mixtape) => mixtape.id !== id))
    setCounts((currentCounts) => ({ ...currentCounts, mixtapes: Math.max(0, (currentCounts.mixtapes ?? 0) - 1) }))
  }

  function handleEventChange(event) {
    const { name, value } = event.target
    setEventForm((currentForm) => ({ ...currentForm, [name]: name === 'sort_order' ? Number(value) : value }))
  }

  function editEvent(event) {
    setEventForm({
      id: event.id,
      month: event.month,
      day: event.day,
      title: event.title,
      details: event.details,
      sort_order: event.sort_order
    })
    setError('')
    document.getElementById('events-management-title')?.scrollIntoView({ behavior: 'smooth' })
  }

  function cancelEventEdit() {
    setEventForm(emptyEvent)
  }

  async function handleEventSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSavingEvent(true)

    try {
      const { data, error: saveError } = await getSupabaseClient()
        .from('events')
        .upsert(eventForm)
        .select()
        .single()

      if (saveError) {
        throw saveError
      }

      setEvents((currentEvents) => {
        const withoutSaved = currentEvents.filter((currentEvent) => currentEvent.id !== data.id)
        const nextEvents = [...withoutSaved, data].sort((first, second) => first.sort_order - second.sort_order)
        setCounts((currentCounts) => ({ ...currentCounts, events: nextEvents.length }))
        return nextEvents
      })
      setEventForm(emptyEvent)
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setIsSavingEvent(false)
    }
  }

  async function handleEventDelete(id) {
    setError('')

    if (!window.confirm('Delete this event from the public site?')) {
      return
    }

    const { error: deleteError } = await getSupabaseClient().from('events').delete().eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setEvents((currentEvents) => currentEvents.filter((currentEvent) => currentEvent.id !== id))
    setCounts((currentCounts) => ({ ...currentCounts, events: Math.max(0, (currentCounts.events ?? 0) - 1) }))
  }

  function handleGalleryChange(event) {
    const { name, value } = event.target
    setGalleryForm((currentForm) => ({ ...currentForm, [name]: name === 'sort_order' ? Number(value) : value }))
  }

  function editGalleryItem(item) {
    setGalleryForm({ id: item.id, src: item.src, alt: item.alt, sort_order: item.sort_order })
    setError('')
    document.getElementById('gallery-management-title')?.scrollIntoView({ behavior: 'smooth' })
  }

  function cancelGalleryEdit() {
    setGalleryForm(emptyGalleryItem)
    setGalleryFile(null)
  }

  async function handleGallerySubmit(event) {
    event.preventDefault()
    setError('')
    setIsSavingGallery(true)

    try {
      const { data: sessionData } = await getSupabaseClient().auth.getSession()
      const accessToken = sessionData.session?.access_token

      if (!accessToken) {
        throw new Error('Your admin session has expired. Please sign in again.')
      }

      const src = galleryFile
        ? await uploadToCloudinary(galleryFile, 'gallery', 'image', accessToken)
        : galleryForm.src
      const { data, error: saveError } = await getSupabaseClient()
        .from('gallery_items')
        .upsert({ ...galleryForm, src })
        .select()
        .single()

      if (saveError) {
        throw saveError
      }

      setGalleryItems((currentItems) => {
        const withoutSaved = currentItems.filter((item) => item.id !== data.id)
        const nextItems = [...withoutSaved, data].sort((first, second) => first.sort_order - second.sort_order)
        setCounts((currentCounts) => ({ ...currentCounts, gallery_items: nextItems.length }))
        return nextItems
      })
      setGalleryForm(emptyGalleryItem)
      setGalleryFile(null)
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setIsSavingGallery(false)
    }
  }

  async function handleGalleryDelete(id) {
    setError('')

    if (!window.confirm('Delete this gallery item from the public site?')) {
      return
    }

    const { error: deleteError } = await getSupabaseClient().from('gallery_items').delete().eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setGalleryItems((currentItems) => currentItems.filter((item) => item.id !== id))
    setCounts((currentCounts) => ({ ...currentCounts, gallery_items: Math.max(0, (currentCounts.gallery_items ?? 0) - 1) }))
  }

  async function handleBookingStatusChange(id, status) {
    setError('')

    const { data, error: updateError } = await getSupabaseClient()
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select('id, name, email, event_type, message, status, created_at')
      .single()

    if (updateError) {
      setError(updateError.message)
      return
    }

    setBookings((currentBookings) => currentBookings.map((booking) => booking.id === data.id ? data : booking))
  }

  return (
    <main className="admin-dashboard-page">
      <div className="admin-dashboard-header">
        <div>
          <p className="eyebrow">INT&apos;L DJ EXPERIENCE</p>
          <h1>Dashboard</h1>
          <p className="admin-user">Signed in as {user.email}</p>
        </div>
        <button className="admin-signout-button" type="button" onClick={handleSignOut}>
          Sign out
        </button>
      </div>
      <section aria-labelledby="overview-title">
        <p className="eyebrow">Content overview</p>
        <h2 id="overview-title">Your website at a glance</h2>
        {isLoading && <p className="admin-status">Loading content counts...</p>}
        {error && <p className="admin-login-error" role="alert">{error}</p>}
        <div className="admin-stat-grid">
          {contentTables.map(({ key, label }) => (
            <article className="admin-stat" key={key}>
              <span>{label}</span>
              <strong>{counts[key] ?? '-'}</strong>
            </article>
          ))}
        </div>
      </section>
      <section className="admin-next-section" aria-labelledby="events-management-title">
        <p className="eyebrow">Event management</p>
        <h2 id="events-management-title">Manage upcoming events</h2>
        <form className="admin-content-form" onSubmit={handleEventSubmit}>
          {Object.entries(emptyEvent).map(([field]) => (
            <label key={field}>
              {field.replace('_', ' ')}
              <input name={field} type={field === 'sort_order' ? 'number' : 'text'} value={eventForm[field]} onChange={handleEventChange} required={field !== 'sort_order'} />
            </label>
          ))}
          <button type="submit" disabled={isSavingEvent}>
            {isSavingEvent ? 'Saving...' : 'Save event'}
          </button>
          {eventForm.id && <button className="admin-cancel-button" type="button" onClick={cancelEventEdit}>Cancel edit</button>}
        </form>
        <div className="admin-content-list">
          {events.map((event) => (
            <article className="admin-content-row" key={event.id}>
              <div>
                <strong>{event.title}</strong>
                <span>{event.month} {event.day} - {event.details}</span>
              </div>
              <div className="admin-row-actions">
                <button type="button" onClick={() => editEvent(event)}>Edit</button>
                <button type="button" onClick={() => handleEventDelete(event.id)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="admin-next-section" aria-labelledby="mixtape-management-title">
        <p className="eyebrow">Mixtape management</p>
        <h2 id="mixtape-management-title">Manage the sound</h2>
        <form className="admin-content-form" onSubmit={handleMixtapeSubmit}>
          <label>
            upload artwork
            <input type="file" accept="image/*" onChange={(event) => setMixtapeArtworkFile(event.target.files?.[0] ?? null)} />
            {mixtapeArtworkFile && <small className="selected-file">Selected: {mixtapeArtworkFile.name} ({formatFileSize(mixtapeArtworkFile.size)})</small>}
          </label>
          <label>
            upload audio
            <input type="file" accept="audio/*" onChange={(event) => setMixtapeAudioFile(event.target.files?.[0] ?? null)} />
            {mixtapeAudioFile && <small className="selected-file">Selected: {mixtapeAudioFile.name} ({formatFileSize(mixtapeAudioFile.size)})</small>}
          </label>
          {Object.entries(emptyMixtape).map(([field]) => (
            <label key={field}>
              {field.replace('_', ' ')}
              {field === 'description' ? (
                <textarea name={field} value={mixtapeForm[field]} onChange={handleMixtapeChange} rows="3" required={field !== 'audio_url'} />
              ) : (
                <input name={field} value={mixtapeForm[field]} onChange={handleMixtapeChange} required={field !== 'audio_url' && !(field === 'artwork' && mixtapeArtworkFile)} />
              )}
            </label>
          ))}
          <button type="submit" disabled={isSavingMixtape}>
            {isSavingMixtape ? 'Saving...' : 'Save mixtape'}
          </button>
          {mixtapeForm.id && <button className="admin-cancel-button" type="button" onClick={cancelMixtapeEdit}>Cancel edit</button>}
          {mixtapeStatus && <p className="admin-form-status" role="status">{mixtapeStatus}</p>}
        </form>
        <div className="admin-content-list">
          {mixtapes.map((mixtape) => (
            <article className="admin-content-row" key={mixtape.id}>
              <div>
                <strong>{mixtape.title}</strong>
                <span>{mixtape.genre}</span>
              </div>
              <div className="admin-row-actions">
                <button type="button" onClick={() => editMixtape(mixtape)}>Edit</button>
                <button type="button" onClick={() => handleMixtapeDelete(mixtape.id)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="admin-next-section" aria-labelledby="gallery-management-title">
        <p className="eyebrow">Gallery management</p>
        <h2 id="gallery-management-title">Manage the moments</h2>
        <form className="admin-content-form" onSubmit={handleGallerySubmit}>
          <label>
            upload image
            <input type="file" accept="image/*" onChange={(event) => setGalleryFile(event.target.files?.[0] ?? null)} />
            {galleryFile && <small className="selected-file">Selected: {galleryFile.name} ({formatFileSize(galleryFile.size)})</small>}
          </label>
          {Object.entries(emptyGalleryItem).map(([field]) => (
            <label key={field}>
              {field.replace('_', ' ')}
              <input name={field} type={field === 'sort_order' ? 'number' : 'text'} value={galleryForm[field]} onChange={handleGalleryChange} required={field !== 'sort_order' && !(field === 'src' && galleryFile)} />
            </label>
          ))}
          <button type="submit" disabled={isSavingGallery}>
            {isSavingGallery ? 'Saving...' : 'Save gallery item'}
          </button>
          {galleryForm.id && <button className="admin-cancel-button" type="button" onClick={cancelGalleryEdit}>Cancel edit</button>}
        </form>
        <div className="admin-content-list">
          {galleryItems.map((item) => (
            <article className="admin-content-row" key={item.id}>
              <div>
                <strong>{item.alt}</strong>
                <span>{item.src}</span>
              </div>
              <div className="admin-row-actions">
                <button type="button" onClick={() => editGalleryItem(item)}>Edit</button>
                <button type="button" onClick={() => handleGalleryDelete(item.id)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="admin-next-section" aria-labelledby="bookings-title">
        <p className="eyebrow">Booking inbox</p>
        <h2 id="bookings-title">Visitor enquiries</h2>
        <div className="admin-content-list">
          {bookings.length === 0 && <p className="admin-status">No booking enquiries yet.</p>}
          {bookings.map((booking) => (
            <article className="admin-booking-row" key={booking.id}>
              <div>
                <strong>{booking.name} - {booking.event_type}</strong>
                <a href={`mailto:${booking.email}`}>{booking.email}</a>
                <p>{booking.message}</p>
              </div>
              <select value={booking.status} onChange={(event) => handleBookingStatusChange(booking.id, event.target.value)} aria-label={`Status for ${booking.name}`}>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="booked">Booked</option>
                <option value="closed">Closed</option>
              </select>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default AdminDashboard
