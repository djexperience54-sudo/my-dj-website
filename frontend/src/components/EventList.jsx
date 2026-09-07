function EventList({ events }) {
  return (
    <div className="event-list">
      {events.map((event) => (
        <article className="event-row" key={event.id}>
          <div className="event-date">
            <span>{event.month}</span>
            <strong>{event.day}</strong>
          </div>
          <div>
            <h3>{event.title}</h3>
            <p>{event.details}</p>
          </div>
          <a className="event-details" href="#book">
            Details
          </a>
        </article>
      ))}
    </div>
  )
}

export default EventList
