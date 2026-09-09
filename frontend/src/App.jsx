import { useEffect, useState } from 'react'
import './App.css'
import AboutSection from './components/AboutSection'
import BookingSection from './components/BookingSection'
import EventList from './components/EventList'
import GalleryPreview from './components/GalleryPreview'
import GenreNavigation from './components/GenreNavigation'
import MixtapeCard from './components/MixtapeCard'
import MusicPlatforms from './components/MusicPlatforms'
import MusicPlayer from './components/MusicPlayer'
import SiteFooter from './components/SiteFooter'
import { getDownloadUrl } from './lib/cloudinaryUpload'
import { apiUrl } from './lib/api'
import { upcomingEvents } from './data/events'
import { genres } from './data/genres'
import { featuredMixtapes } from './data/mixtapes'
import { djProfile, socialPlatforms } from './data/profile'
import { galleryItems, musicPlatforms } from './data/media'

const navigationItems = ['Mixes', 'Sound', 'Events', 'About']

function SiteSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchStatus, setSearchStatus] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    const normalizedTerm = searchTerm.trim().toLowerCase()

    if (!normalizedTerm) {
      setSearchStatus('Enter a search term.')
      return
    }

    const matchingSections = Array.from(document.querySelectorAll('main section')).filter((section) =>
      section.textContent.toLowerCase().includes(normalizedTerm)
    )

    if (matchingSections.length === 0) {
      setSearchStatus('No matching content found.')
      return
    }

    setSearchStatus(`${matchingSections.length} matching section${matchingSections.length === 1 ? '' : 's'} found.`)
    matchingSections[0].scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <form className="site-search" role="search" onSubmit={handleSubmit}>
      <label htmlFor="site-search-input">Search the site</label>
      <input
        id="site-search-input"
        type="search"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder="Search the site"
        aria-describedby="search-status"
      />
      <button type="submit">Search</button>
      <output id="search-status" className="search-status" aria-live="polite">
        {searchStatus}
      </output>
    </form>
  )
}

function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      <header className="site-header">
        <div className="site-container header-content">
          <a className="brand" href="#top">
            INT'L DJ <span>EXPERIENCE</span>
          </a>
          <nav className={isMenuOpen ? 'is-open' : ''} aria-label="Primary navigation">
            {navigationItems.map((item) => (
              <a href={`#${item.toLowerCase()}`} key={item} onClick={() => setIsMenuOpen(false)}>
                {item}
              </a>
            ))}
          </nav>
          <SiteSearch />
          <a className="book-button" href="#book">
            Book DJ
          </a>
          <button
            className="menu-button"
            type="button"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? 'Close' : 'Menu'}
          </button>
        </div>
      </header>
    </>
  )
}

function MixtapeLibrary({ mixtapes, onPlay }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('All genres')
  const genresInLibrary = ['All genres', ...new Set(mixtapes.map((mixtape) => mixtape.genre))]
  const normalizedSearchTerm = searchTerm.trim().toLowerCase()
  const filteredMixtapes = mixtapes.filter((mixtape) => {
    const matchesGenre = selectedGenre === 'All genres' || mixtape.genre === selectedGenre
    const searchableText = `${mixtape.title} ${mixtape.genre} ${mixtape.description}`.toLowerCase()
    return matchesGenre && searchableText.includes(normalizedSearchTerm)
  })

  return (
    <section className="library-section" aria-labelledby="library-title">
      <div className="site-container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">The collection</p>
            <h2 id="library-title">Mixtape Library</h2>
          </div>
          <span className="library-count">{filteredMixtapes.length} mix{filteredMixtapes.length === 1 ? '' : 'es'}</span>
        </div>
        <div className="library-filters">
          <label>
            Search mixes
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Title, genre or mood"
            />
          </label>
          <label>
            Genre
            <select value={selectedGenre} onChange={(event) => setSelectedGenre(event.target.value)}>
              {genresInLibrary.map((genre) => <option key={genre}>{genre}</option>)}
            </select>
          </label>
        </div>
        {filteredMixtapes.length > 0 ? (
          <div className="mix-card-grid">
            {filteredMixtapes.map((mixtape) => <MixtapeCard key={mixtape.id} mixtape={mixtape} onPlay={onPlay} />)}
          </div>
        ) : (
          <p className="data-status">No mixes match your search.</p>
        )}
      </div>
    </section>
  )
}

function MixtapeDetail({ mixtape, onPlay }) {
  return (
    <section className="mix-detail-section" aria-labelledby="mix-detail-title">
      <div className="site-container mix-detail-layout">
        <img src={mixtape.artwork} alt={`${mixtape.title} artwork`} />
        <div>
          <a className="back-link" href="/#library-title">Back to mixtape library</a>
          <p className="eyebrow">{mixtape.genre}</p>
          <h1 id="mix-detail-title">{mixtape.title}</h1>
          <p className="mix-detail-description">{mixtape.description}</p>
          {mixtape.audio_url ? (
            <>
              <audio controls src={mixtape.audio_url} aria-label={`Play ${mixtape.title}`} />
              <button className="player-launch-link" type="button" onClick={() => onPlay(mixtape)}>Play in site player</button>
              <a className="primary-button" href={getDownloadUrl(mixtape.audio_url, mixtape.title)} download>Download mix</a>
            </>
          ) : (
            <p className="data-status">Audio is not available for this mix yet.</p>
          )}
        </div>
      </div>
    </section>
  )
}

function App() {
  const [mixtapes, setMixtapes] = useState(featuredMixtapes)
  const [events, setEvents] = useState(upcomingEvents)
  const [gallery, setGallery] = useState(galleryItems)
  const [isLoadingMixtapes, setIsLoadingMixtapes] = useState(true)
  const [mixtapeError, setMixtapeError] = useState('')
  const [contentError, setContentError] = useState('')
  const [currentMixtape, setCurrentMixtape] = useState(null)
  const detailId = window.location.pathname.startsWith('/mixes/') ? window.location.pathname.split('/')[2] : ''

  useEffect(() => {
    async function loadContent() {
      try {
        const [mixtapeResponse, eventResponse, galleryResponse] = await Promise.all([
          fetch(apiUrl('/api/mixtapes')),
          fetch(apiUrl('/api/events')),
          fetch(apiUrl('/api/gallery'))
        ])

        if (!mixtapeResponse.ok || !eventResponse.ok || !galleryResponse.ok) {
          throw new Error('Some website content could not be loaded.')
        }

        const [mixtapeResult, eventResult, galleryResult] = await Promise.all([
          mixtapeResponse.json(),
          eventResponse.json(),
          galleryResponse.json()
        ])

        setMixtapes(mixtapeResult.data)
        setEvents(eventResult.data)
        setGallery(galleryResult.data)
      } catch (error) {
        setContentError(error.message)
        setMixtapeError(error.message)
      } finally {
        setIsLoadingMixtapes(false)
      }
    }

    loadContent()
  }, [])

  const detailMixtape = mixtapes.find((mixtape) => mixtape.id === detailId)

  if (detailId && detailMixtape) {
    return (
      <div id="top">
        <SiteHeader />
        <main><MixtapeDetail mixtape={detailMixtape} onPlay={setCurrentMixtape} /></main>
        <SiteFooter />
        <MusicPlayer mixtape={currentMixtape} onClose={() => setCurrentMixtape(null)} />
      </div>
    )
  }

  return (
    <div id="top">
      <SiteHeader />
      <main>
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="site-container hero-layout">
            <div className="hero-copy">
              <p className="eyebrow">INT'L DJ EXPERIENCE</p>
              <h1 id="hero-title">INT'L DJ EXPERIENCE</h1>
              <p className="hero-description">
                Afrobeats, Amapiano, Afrohouse, Drill, Asakaa and Afrofusion - curated for unforgettable moments, from intimate events to packed dance floors.
              </p>
              <div className="hero-actions">
                <a className="primary-button" href="#mixes">Listen to latest mix</a>
                <a className="secondary-button" href="#book">Book for an event</a>
              </div>
            </div>
            <div className="hero-image">
              <img
                src="https://images.unsplash.com/photo-1571266028243-d220c19c9f4c?auto=format&fit=crop&w=1000&q=85"
                alt="DJ performing to a crowd"
              />
              <span>DJ - SELECTOR - EXPERIENCE</span>
            </div>
          </div>
        </section>
        <section className="mixes-section" aria-labelledby="mixes-title">
          <div className="site-container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Featured sound</p>
                <h2 id="mixes-title">Latest Mixtape</h2>
              </div>
              <a href="#sound">Browse the sound</a>
            </div>
            {isLoadingMixtapes && <p className="data-status">Loading mixtapes...</p>}
            {mixtapeError && <p className="data-status">Using local mixtape data.</p>}
            {mixtapes.length > 0 && (
              <>
                <div className="featured-mixtape">
                  <img src={mixtapes[0].artwork} alt={`${mixtapes[0].title} artwork`} />
                  <div className="featured-mixtape-content">
                    <p className="mix-card-genre">{mixtapes[0].genre} - 2026</p>
                    <h3>{mixtapes[0].title}</h3>
                    <p>{mixtapes[0].description}</p>
                    <audio controls src={mixtapes[0].audio_url || undefined} aria-label={`Play ${mixtapes[0].title}`} />
                    {mixtapes[0].audio_url && (
                      <a className="text-link" href={getDownloadUrl(mixtapes[0].audio_url, mixtapes[0].title)} download>
                        Download mix
                      </a>
                    )}
                    <a className="text-link" href="#book">Book the experience</a>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
        <MixtapeLibrary mixtapes={mixtapes} onPlay={setCurrentMixtape} />
        <section className="sound-section" id="sound" aria-labelledby="sound-title">
          <div className="site-container">
            <p className="eyebrow">Browse by genre</p>
            <h2 id="sound-title">The Sound</h2>
            <p className="section-description">
              Every genre connects directly to its own collection of mixtapes. As more mixes are uploaded, the collection grows with them.
            </p>
            <GenreNavigation genres={genres} />
          </div>
        </section>
        <section className="events-section" id="events" aria-labelledby="events-title">
          <div className="site-container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Where the sound lands</p>
                <h2 id="events-title">Upcoming Events</h2>
              </div>
            </div>
            {contentError && <p className="data-status">Using local event data.</p>}
            <EventList events={events} />
          </div>
        </section>
        <AboutSection profile={djProfile} platforms={socialPlatforms} />
        <GalleryPreview items={gallery} />
        <MusicPlatforms platforms={musicPlatforms} />
        <BookingSection />
      </main>
      <SiteFooter />
      <MusicPlayer mixtape={currentMixtape} onClose={() => setCurrentMixtape(null)} />
    </div>
  )
}

export default App
