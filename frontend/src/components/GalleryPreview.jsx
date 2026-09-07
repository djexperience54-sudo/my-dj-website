function GalleryPreview({ items }) {
  return (
    <section className="gallery-section" aria-labelledby="gallery-title">
      <div className="site-container">
        <p className="eyebrow">From the moments</p>
        <h2 id="gallery-title">Gallery</h2>
        <div className="gallery-grid">
          {items.map((item) => (
            <img key={item.id} src={item.src} alt={item.alt} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default GalleryPreview
