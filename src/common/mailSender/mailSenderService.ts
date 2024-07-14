import nodemailer from 'nodemailer';

// TODO: Check configuracion de SMTP server to debug emails to send

const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 465,
  // secure: false,
  auth: {
    user: 'yaciro8783@furnato.com',
    pass: '',
  },
});

async function sendMailTo(mails: Array<string>, subject: string, html: string) {
  const info = await transporter.sendMail({
    from: 'yaciro8783@furnato.com',
    to: mails.join(','),
    subject: subject,
    html: html,
  });
  console.log('Message sent: %s', info.messageId);
  // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
}

export default sendMailTo;

// main().catch(console.error);
