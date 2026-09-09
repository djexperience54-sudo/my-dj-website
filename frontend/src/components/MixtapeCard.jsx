import { getDownloadUrl } from '../lib/cloudinaryUpload'

function MixtapeCard({ mixtape, onPlay }) {
  return (
    <article className="mix-card">
      <img src={mixtape.artwork} alt={`${mixtape.title} artwork`} />
      <div className="mix-card-content">
        <p className="mix-card-genre">{mixtape.genre}</p>
        <h2>{mixtape.title}</h2>
        <p>{mixtape.description}</p>
        <audio controls src={mixtape.audio_url || undefined} aria-label={`Play ${mixtape.title}`} />
        <div className="mix-action-row">
          {mixtape.audio_url && onPlay && (
            <button className="mix-action-button mix-action-button--secondary" type="button" onClick={() => onPlay(mixtape)}>
              Play in site player
            </button>
          )}
          {mixtape.audio_url && (
            <a className="mix-action-button mix-action-button--primary" href={getDownloadUrl(mixtape.audio_url, mixtape.title)} download>
              Download Mix
            </a>
          )}
        </div>
        <a className="mix-detail-link" href={`/mixes/${mixtape.id}`}>Open mix details</a>
      </div>
    </article>
  )
}

export default MixtapeCard
