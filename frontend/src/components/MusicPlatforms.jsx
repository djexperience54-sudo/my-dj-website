function MusicPlatforms({ platforms }) {
  return (
    <section className="platforms-section" aria-labelledby="platforms-title">
      <div className="site-container">
        <p className="eyebrow">Listen anywhere</p>
        <h2 id="platforms-title">More Platforms</h2>
        <nav className="platform-links" aria-label="External music platforms">
          {platforms.map((platform) => (
            <a
              href={platform.href}
              key={platform.name}
              target={platform.target || '_blank'}
              rel={platform.rel || 'noreferrer'}
            >
              {platform.name}
            </a>
          ))}
        </nav>
      </div>
    </section>
  )
}

export default MusicPlatforms
