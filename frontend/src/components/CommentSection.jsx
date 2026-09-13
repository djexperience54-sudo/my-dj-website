import { useEffect, useState } from 'react'
import { apiUrl } from '../lib/api'
import { getSupabaseClient } from '../lib/supabaseClient'

const initialForm = {
  name: '',
  mood: 'good',
  message: ''
}

const requestTimeoutMs = 20000

function CommentSection() {
  const [form, setForm] = useState(initialForm)
  const [comments, setComments] = useState([])
  const [user, setUser] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(apiUrl('/api/comments'))
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Comments could not be loaded.')))
      .then((result) => setComments(result.data || []))
      .catch(() => {})
  }, [])
  useEffect(() => {
    const supabase = getSupabaseClient()
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => listener.subscription.unsubscribe()
  }, [])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
    setSubmitted(false)
    setError('')
  }

  async function signInWithGoogle() {
    setError('')
    const { error: signInError } = await getSupabaseClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    if (signInError) setError('Google sign-in is not available right now. Please try again.')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!event.currentTarget.checkValidity()) {
      return
    }

    if (!user) {
      setError('Sign in with Google before posting a comment.')
      return
    }

    setIsSubmitting(true)
    setError('')
    const { data: sessionData } = await getSupabaseClient().auth.getSession()
    const accessToken = sessionData.session?.access_token
    if (!accessToken) {
      setError('Your Google session expired. Please sign in again.')
      setIsSubmitting(false)
      return
    }
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs)

    try {
      const response = await fetch(apiUrl('/api/comments'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(form),
        signal: controller.signal
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(result.error || 'Your comment could not be posted. Please try again.')
      }

      setSubmitted(true)
      setComments((currentComments) => [result.data, ...currentComments])
      setForm(initialForm)
    } catch (submissionError) {
      setError(submissionError.name === 'AbortError' ? 'The server took too long to respond. Please try again.' : submissionError.message)
    } finally {
      window.clearTimeout(timeoutId)
      setIsSubmitting(false)
    }
  }

  async function handleLike(commentId) {
    if (!user) {
      setError('Sign in with Google to like comments.')
      return
    }
    const { data: sessionData } = await getSupabaseClient().auth.getSession()
    const accessToken = sessionData.session?.access_token
    const response = await fetch(apiUrl(`/api/comments/${commentId}/like`), {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) {
      setError(result.error || 'That like could not be saved.')
      return
    }
    setComments((currentComments) => currentComments.map((comment) => comment.id === commentId ? { ...comment, likes: result.data.likes } : comment))
  }

  return (
    <section className="comment-section" aria-labelledby="comments-title">
      <div className="site-container comment-layout">
        <div className="comment-introduction">
          <p className="eyebrow">Listener feedback</p>
          <h2 id="comments-title">Tell us what you felt.</h2>
        </div>

        <form className="comment-form" onSubmit={handleSubmit}>
          {!user ? (
            <button type="button" onClick={signInWithGoogle}>Sign in with Google to comment</button>
          ) : (
            <p className="comment-signed-in">Commenting as {user.user_metadata?.full_name || user.user_metadata?.name || user.email}</p>
          )}

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

          <button type="submit" disabled={isSubmitting || !user}>
            {isSubmitting ? 'Posting...' : 'Send comment'}
          </button>

          {submitted && (
            <p className="form-status" role="status">
              Thanks for the feedback. Your comment has been posted successfully.
            </p>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
        </form>
        <div className="public-comments" aria-live="polite">
          <h3>What listeners are saying</h3>
          {comments.length === 0 && <p>No comments yet. Be the first to share your experience.</p>}
          {comments.map((comment) => (
            <article key={comment.id} className="public-comment">
              <strong>{comment.name}</strong>
              <span>{comment.mood}</span>
              <p>{comment.message}</p>
              <button type="button" className="comment-like-button" onClick={() => handleLike(comment.id)}>Like ({comment.likes || 0})</button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CommentSection
