const nodemailer = require('nodemailer')

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
    auth: {
      user,
      pass
    }
  })
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

  await transporter.sendMail(mailOptions)
}

module.exports = { sendBookingEmail }
