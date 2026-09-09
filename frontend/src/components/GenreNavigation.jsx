function GenreNavigation({ genres, mixtapes = [] }) {
  const genreCounts = Object.fromEntries(
    (genres || []).map((genre) => [genre.name, 0])
  )

  for (const mixtape of mixtapes) {
    if (mixtape.genre && genreCounts[mixtape.genre] !== undefined) {
      genreCounts[mixtape.genre] += 1
    }
  }

  const visibleGenres = (genres || []).filter((genre) => (genreCounts[genre.name] || 0) > 0)

  return (
    <nav className="genre-navigation" aria-label="Browse mixtapes by genre">
      {visibleGenres.map((genre) => (
        <a href={`#genre-${genre.slug}`} key={genre.name}>
          <span>{genre.name}</span>
          <span>{genreCounts[genre.name] || 0}</span>
        </a>
      ))}
    </nav>
  )
}

export default GenreNavigation
