import BookingForm from './BookingForm'

function BookingSection() {
  return (
    <section className="booking-section" id="book" aria-labelledby="booking-title">
      <div className="site-container booking-content">
        <div className="booking-introduction">
          <p className="eyebrow">Let&apos;s create the moment</p>
          <h2 id="booking-title">Book the Experience.</h2>
          <p>Events - Clubs - Brands - Private parties - Festivals</p>
        </div>
        <BookingForm />
      </div>
    </section>
  )
}

export default BookingSection
