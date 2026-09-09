import { getDownloadUrl } from '../lib/cloudinaryUpload'

function stopOtherAudio(event) {
  const activeAudioElements = document.querySelectorAll('audio')

  activeAudioElements.forEach((audioElement) => {
    if (audioElement !== event.currentTarget) {
      audioElement.pause()
    }
  })
}

function MusicPlayer({ mixtape, onClose }) {
  if (!mixtape) {
    return null
  }

  return (
    <aside className="music-player" aria-label="Now playing">
      <div className="music-player-info">
        <img src={mixtape.artwork} alt="" />
        <div>
          <strong>{mixtape.title}</strong>
          <span>{mixtape.genre}</span>
        </div>
      </div>
      {mixtape.audio_url ? (
        <audio controls autoPlay src={mixtape.audio_url} aria-label={`Play ${mixtape.title}`} onPlay={stopOtherAudio} />
      ) : (
        <span className="music-player-unavailable">Audio unavailable</span>
      )}
      {mixtape.audio_url && (
        <a href={getDownloadUrl(mixtape.audio_url, mixtape.title)} download aria-label={`Download ${mixtape.title}`}>
          Download
        </a>
      )}
      <button type="button" onClick={onClose} aria-label="Close music player">Close</button>
    </aside>
  )
}

export default MusicPlayer
