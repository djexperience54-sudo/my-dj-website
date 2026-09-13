import { useState } from 'react'
import { apiUrl } from '../lib/api'

const initialForm = {
  name: '',
  email: '',
  mood: 'good',
  message: ''
}

const requestTimeoutMs = 20000

function CommentSection() {
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
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs)

    try {
      const response = await fetch(apiUrl('/api/comments'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        signal: controller.signal
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(result.error || 'Your comment could not be posted. Please try again.')
      }

      setSubmitted(true)
      setForm(initialForm)
    } catch (submissionError) {
      setError(submissionError.name === 'AbortError' ? 'The server took too long to respond. Please try again.' : submissionError.message)
    } finally {
      window.clearTimeout(timeoutId)
      setIsSubmitting(false)
    }
  }

  return (
    <section className="comment-section" aria-labelledby="comments-title">
      <div className="site-container comment-layout">
        <div className="comment-introduction">
          <p className="eyebrow">Listener feedback</p>
          <h2 id="comments-title">Tell us what you felt.</h2>
        </div>

        <form className="comment-form" onSubmit={handleSubmit}>
          <label>
            Name
            <input name="name" value={form.name} onChange={handleChange} placeholder="Your name" required />
          </label>

          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
          </label>

          <label>
            How did it feel?
            <select name="mood" value={form.mood} onChange={handleChange}>
              <option value="good">Good</option>
              <option value="neutral">Neutral</option>
              <option value="bad">Bad</option>
            </select>
          </label>

          <label className="comment-field-label">
            Comment
            <textarea name="message" value={form.message} onChange={handleChange} rows="4" placeholder="Tell us about the mixtape, the vibe, or the night..." required />
          </label>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Posting...' : 'Send comment'}
          </button>

          {submitted && (
            <p className="form-status" role="status">
              Thanks for the feedback. Your comment has been posted successfully.
            </p>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
        </form>
      </div>
    </section>
  )
}

export default CommentSection
