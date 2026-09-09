import { useEffect, useState } from 'react'
import { getSupabaseClient } from '../lib/supabaseClient'
import AdminDashboard from './AdminDashboard'
import './AdminLogin.css'

function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [user, setUser] = useState(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [sessionMessage, setSessionMessage] = useState('')

  useEffect(() => {
    const supabase = getSupabaseClient()

    async function checkSession() {
      const { data } = await supabase.auth.getSession()
      const session = data.session

      if (!session) {
        setUser(null)
        setSessionMessage('')
        setIsCheckingSession(false)
        return
      }

      const expiresAt = Number(session.expires_at || 0) * 1000
      if (expiresAt <= Date.now()) {
        await supabase.auth.signOut()
        setUser(null)
        setSessionMessage('Your admin session expired. Please sign in again.')
        setIsCheckingSession(false)
        return
      }

      setUser(session.user)
      setSessionMessage('Session active')
      setIsCheckingSession(false)
    }

    checkSession()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setSessionMessage(session ? 'Session active' : '')
    })

    return () => authListener.subscription.unsubscribe()
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const { data, error: signInError } = await getSupabaseClient().auth.signInWithPassword({ email, password })

      if (signInError) {
        throw signInError
      }

      setUser(data.user)
    } catch (signInError) {
      setError(signInError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (user) {
    return <AdminDashboard user={user} onSignOut={() => setUser(null)} />
  }

  if (isCheckingSession) {
    return <main className="admin-login-page"><p className="admin-status">Checking admin session...</p></main>
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-panel" aria-labelledby="admin-login-title">
        <a className="admin-back-link" href="/">Back to website</a>
        <p className="eyebrow">INT&apos;L DJ EXPERIENCE</p>
        <h1 id="admin-login-title">Admin sign in</h1>
        <form onSubmit={handleSubmit}>
            <label>
              Email
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label>
              Password
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
            {sessionMessage && <p className="admin-login-success">{sessionMessage}</p>}
            {error && <p className="admin-login-error" role="alert">{error}</p>}
        </form>
      </section>
    </main>
  )
}

export default AdminLogin
