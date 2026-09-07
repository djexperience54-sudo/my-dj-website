import SocialLinks from './SocialLinks'

function AboutSection({ profile, platforms }) {
  return (
    <section className="about-section" id="about" aria-labelledby="about-title">
      <div className="site-container about-layout">
        <img src={profile.image} alt={profile.imageAlt} />
        <div className="about-content">
          <p className="eyebrow">{profile.eyebrow}</p>
          <h2 id="about-title">{profile.name}</h2>
          {profile.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <a className="about-button" href="#book">
            Bookings and Collaborations
          </a>
          <SocialLinks platforms={platforms} />
        </div>
      </div>
    </section>
  )
}

export default AboutSection
