const nodemailer = require('nodemailer')

const emailTimeoutMs = 15000

function createTransport() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!user || !pass) {
    throw new Error('SMTP user and password are required to send email.')
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    connectionTimeout: emailTimeoutMs,
    greetingTimeout: emailTimeoutMs,
    socketTimeout: emailTimeoutMs,
    auth: {
      user,
      pass
    }
  })
}

async function sendWithTimeout(sendOperation) {
  let timeoutId
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Email delivery timed out.')), emailTimeoutMs)
  })

  try {
    return await Promise.race([sendOperation(), timeout])
  } finally {
    clearTimeout(timeoutId)
  }
}

async function sendBookingEmail({ to, from, name, email, eventType, message }) {
  const transporter = createTransport()

  const mailOptions = {
    from: from || process.env.SMTP_USER,
    to,
    replyTo: email,
    subject: `New booking request from ${name}`,
    text: [
      `Name: ${name}`,
      `Email: ${email}`,
      `Event type: ${eventType}`,
      '',
      'Message:',
      message
    ].join('\n')
  }

  await sendWithTimeout(() => transporter.sendMail(mailOptions))
}

async function sendCommentEmail({ to, from, name, email, mood, message }) {
  const transporter = createTransport()

  await sendWithTimeout(() => transporter.sendMail({
    from: from || process.env.SMTP_USER,
    to,
    replyTo: email,
    subject: `New website comment from ${name}`,
    text: [
      `Name: ${name}`,
      `Email: ${email}`,
      `Mood: ${mood}`,
      '',
      'Comment:',
      message
    ].join('\n')
  }))
}

module.exports = { sendBookingEmail, sendCommentEmail }
