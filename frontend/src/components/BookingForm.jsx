import { useState } from 'react'

const initialForm = {
  name: '',
  email: '',
  eventType: '',
  message: ''
}

function BookingForm() {
  const [form, setForm] = useState(initialForm)
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  function handleChange(event) {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
    setSubmitted(false)
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!event.currentTarget.checkValidity()) {
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (!response.ok) {
        throw new Error('Your enquiry could not be sent. Please try again.')
      }

      setSubmitted(true)
      setForm(initialForm)
    } catch (submissionError) {
      setError(submissionError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="booking-form" onSubmit={handleSubmit}>
      <label>
        Name
        <input name="name" value={form.name} onChange={handleChange} required />
      </label>
      <label>
        Email
        <input name="email" type="email" value={form.email} onChange={handleChange} required />
      </label>
      <label>
        Event type
        <input name="eventType" value={form.eventType} onChange={handleChange} required />
      </label>
      <label>
        Message
        <textarea name="message" value={form.message} onChange={handleChange} rows="4" required />
      </label>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : 'Send booking enquiry'}
      </button>
      {submitted && (
        <p className="form-status" role="status">
          Thanks. Your enquiry has been sent.
        </p>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
  )
}

export default BookingForm
