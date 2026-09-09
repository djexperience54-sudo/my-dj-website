function SocialLinks({ platforms }) {
  return (
    <nav className="social-links" aria-label="Social media links">
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
  )
}

export default SocialLinks
