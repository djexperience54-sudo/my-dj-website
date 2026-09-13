import { useState } from 'react'
import { apiUrl } from '../lib/api'

function EmailVerificationFields({ email, purpose, token, onTokenChange, onVerified }) {
  const [code, setCode] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  async function requestCode() {
    setIsSending(true)
    setError('')
    setStatus('')

    try {
      const response = await fetch(apiUrl('/api/email-verification/request'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose })
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result.error || 'We could not send a verification code.')
      }
      setStatus('Verification code sent. Check your email.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSending(false)
    }
  }

  async function verifyCode() {
    setIsVerifying(true)
    setError('')

    try {
      const response = await fetch(apiUrl('/api/email-verification/verify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose, code })
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result.error || 'That verification code is not valid.')
      }
      onTokenChange(result.data.token)
      onVerified(true)
      setStatus('Email verified. You can now submit.')
    } catch (verificationError) {
      onVerified(false)
      setError(verificationError.message)
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <fieldset className="email-verification" disabled={Boolean(token)}>
      <legend>Email verification</legend>
      <p>Verify that you can access this email before sending.</p>
      <div className="email-verification-actions">
        <button type="button" onClick={requestCode} disabled={isSending || !email || Boolean(token)}>
          {isSending ? 'Sending code...' : 'Send verification code'}
        </button>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="6-digit code"
          aria-label="Email verification code"
          maxLength="6"
          disabled={Boolean(token)}
        />
        <button type="button" onClick={verifyCode} disabled={isVerifying || code.length !== 6 || Boolean(token)}>
          {isVerifying ? 'Verifying...' : 'Verify email'}
        </button>
      </div>
      {status && <small className="form-status" role="status">{status}</small>}
      {error && <small className="form-error" role="alert">{error}</small>}
    </fieldset>
  )
}

export default EmailVerificationFields