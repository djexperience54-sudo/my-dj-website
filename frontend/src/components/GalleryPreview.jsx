import { useEffect, useState } from 'react'

function GalleryPreview({ items }) {
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    if (!selectedItem) {
      return undefined
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setSelectedItem(null)
      }
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedItem])

  function getDownloadName(item) {
    const baseName = item.alt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    return `${baseName || 'intl-dj-experience-gallery'}.jpg`
  }

  return (
    <section className="gallery-section" aria-labelledby="gallery-title">
      <div className="site-container">
        <p className="eyebrow">From the moments</p>
        <h2 id="gallery-title">Gallery</h2>
        <div className="gallery-grid">
          {items.map((item) => (
            <button
              className="gallery-image-button"
              key={item.id}
              type="button"
              onClick={() => setSelectedItem(item)}
              aria-label={`Open ${item.alt}`}
            >
              <img src={item.src} alt={item.alt} />
            </button>
          ))}
        </div>
      </div>
      {selectedItem && (
        <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-labelledby="gallery-lightbox-title" onClick={() => setSelectedItem(null)}>
          <div className="gallery-lightbox-panel" onClick={(event) => event.stopPropagation()}>
            <div className="gallery-lightbox-header">
              <h3 id="gallery-lightbox-title">{selectedItem.alt}</h3>
              <button type="button" className="gallery-lightbox-close" onClick={() => setSelectedItem(null)} aria-label="Close enlarged image">
                Close
              </button>
            </div>
            <img className="gallery-lightbox-image" src={selectedItem.src} alt={selectedItem.alt} />
            <a className="gallery-lightbox-download" href={selectedItem.src} download={getDownloadName(selectedItem)}>
              Download image
            </a>
          </div>
        </div>
      )}
    </section>
  )
}

export default GalleryPreview
