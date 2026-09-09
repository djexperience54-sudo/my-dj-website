function GenreNavigation({ genres }) {
  return (
    <nav className="genre-navigation" aria-label="Browse mixtapes by genre">
      {genres.map((genre) => (
        <a href={`#genre-${genre.slug}`} key={genre.name}>
          <span>{genre.name}</span>
        </a>
      ))}
    </nav>
  )
}

export default GenreNavigation
