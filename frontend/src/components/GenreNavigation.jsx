function GenreNavigation({ genres, mixtapes = [] }) {
  const genreNames = [...new Set([
    ...(genres || []).map((genre) => genre.name),
    ...mixtapes.map((mixtape) => mixtape.genre).filter(Boolean)
  ])]
  const genreCounts = Object.fromEntries(genreNames.map((genreName) => [genreName, 0]))

  for (const mixtape of mixtapes) {
    if (mixtape.genre) {
      genreCounts[mixtape.genre] += 1
    }
  }

  const visibleGenres = genreNames.filter((genreName) => (genreCounts[genreName] || 0) > 0)

  function handleGenreClick(event, genreName) {
    event.preventDefault()
    window.dispatchEvent(new CustomEvent('genre-select', { detail: genreName }))
  }

  return (
    <nav className="genre-navigation" aria-label="Browse mixtapes by genre">
      {visibleGenres.map((genreName) => (
        <a href="#mixtape-library" key={genreName} onClick={(event) => handleGenreClick(event, genreName)}>
          <span>{genreName}</span>
          <span>{genreCounts[genreName] || 0}</span>
        </a>
      ))}
    </nav>
  )
}

export default GenreNavigation
