import { socialPlatforms } from '../data/profile'

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-container footer-content">
        <span>Copyright 2026 INT&apos;L DJ Experience</span>
        <nav aria-label="Footer social links">
          {socialPlatforms.map((platform) => (
            <a href={platform.href} key={platform.name}>
              {platform.name}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  )
}

export default SiteFooter
