import nodemailer from 'nodemailer';

import { config } from '../utils/config';

// TODO: Check configuracion de SMTP server to debug emails to send

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false,
  auth: config.smtp.auth,
});

async function sendMailTo(mails: Array<string>, subject: string, html: string) {
  const info = await transporter.sendMail({
    from: config.smtp.sender,
    to: mails.join(','),
    subject: subject,
    html: html,
  });
  console.log('Message sent: %s', info.messageId);
  // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
}

export default sendMailTo;

// main().catch(console.error);
