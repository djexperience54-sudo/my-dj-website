function SocialLinks({ platforms }) {
  return (
    <nav className="social-links" aria-label="Social media links">
      {platforms.map((platform) => (
        <a href={platform.href} key={platform.name}>
          {platform.name}
        </a>
      ))}
    </nav>
  )
}

export default SocialLinks
