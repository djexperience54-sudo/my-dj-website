import { useEffect, useState } from 'react'
import { getSupabaseClient } from '../lib/supabaseClient'
import AdminDashboard from './AdminDashboard'
import './AdminLogin.css'

function AdminLogin() {
  let supabase
  let configurationError = ''

  try {
    supabase = getSupabaseClient()
  } catch (error) {
    configurationError = error.message
  }

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [error, setError] = useState(configurationError)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [user, setUser] = useState(null)
  const [isCheckingSession, setIsCheckingSession] = useState(Boolean(supabase))
  const [sessionMessage, setSessionMessage] = useState('')
  const [verificationStep, setVerificationStep] = useState(false)
  const [mfaFactorId, setMfaFactorId] = useState('')
  const [mfaChallengeId, setMfaChallengeId] = useState('')

  useEffect(() => {
    if (!supabase) {
      return undefined
    }

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
  }, [supabase])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      if (signInError) {
        throw signInError
      }

      const { data: assuranceData, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

      if (assuranceError) {
        throw assuranceError
      }

      if (assuranceData.nextLevel === 'aal2' && assuranceData.currentLevel !== 'aal2') {
        const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors()

        if (factorsError) {
          throw factorsError
        }

        const factor = factorsData.totp.find((item) => item.status === 'verified')
        if (!factor) {
          await supabase.auth.signOut()
          throw new Error('Multi-factor authentication is required, but no authenticator app is enrolled for this account.')
        }

        const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: factor.id })
        if (challengeError) {
          throw challengeError
        }

        setMfaFactorId(factor.id)
        setMfaChallengeId(challengeData.id)
        setVerificationStep(true)
        setSessionMessage('Enter the code from your authenticator app')
      } else {
        setUser(signInData.user)
        setSessionMessage('Session active')
      }

      setPassword('')
    } catch (signInError) {
      setError(signInError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleVerify(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const { data, error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: mfaChallengeId,
        code: mfaCode.trim()
      })

      if (verifyError) {
        throw verifyError
      }

      if (!data) {
        throw new Error('The authenticator code could not be verified.')
      }

      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) {
        throw userError
      }

      setUser(userData.user)
      setVerificationStep(false)
      setMfaCode('')
      setMfaFactorId('')
      setMfaChallengeId('')
      setSessionMessage('Session active')
    } catch (verifyError) {
      setError(verifyError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (user) {
    return <AdminDashboard user={user} onSignOut={() => {
      setUser(null)
      setVerificationStep(false)
      setMfaCode('')
      setMfaFactorId('')
      setMfaChallengeId('')
      setSessionMessage('Admin locked for inactivity. Please sign in again.')
    }} />
  }

  if (isCheckingSession) {
    return <main className="admin-login-page"><p className="admin-status">Checking admin session...</p></main>
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-panel" aria-labelledby="admin-login-title">
        <a className="admin-back-link" href="/">Back to website</a>
        <p className="eyebrow">INT&apos;L DJ EXPERIENCE</p>
        <h1 id="admin-login-title">{verificationStep ? 'Admin verification' : 'Admin sign in'}</h1>

        {verificationStep ? (
          <form onSubmit={handleVerify}>
            <label>
              Authenticator code
              <input type="text" inputMode="numeric" autoComplete="one-time-code" value={mfaCode} onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit code" pattern="[0-9]{6}" maxLength="6" required />
            </label>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Verifying...' : 'Verify access'}
            </button>
            <button type="button" className="admin-change-user-button" onClick={() => {
              setVerificationStep(false)
              setMfaCode('')
              setMfaFactorId('')
              setMfaChallengeId('')
              setError('')
            }}>
              Back to sign in
            </button>
            {sessionMessage && <p className="admin-login-success">{sessionMessage}</p>}
            {error && <p className="admin-login-error" role="alert">{error}</p>}
          </form>
        ) : (
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
        )}
      </section>
    </main>
  )
}

export default AdminLogin
