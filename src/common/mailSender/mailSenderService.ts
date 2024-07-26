import nodemailer from 'nodemailer';

import { logger } from '@/common/utils/serverLogger';

import { config } from '../utils/config';

let transporter: nodemailer.Transporter;

// BUG: Typescript lo detecta como error de sintaxis, pero el SMTP lleva este tipo de objeto
export const buildTransporter = () =>
  nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    greetingTimeout: 5000,
    secure: config.smtp.auth.secure,
    auth: config.smtp.auth,
  });

export async function initTransporter(t: nodemailer.Transporter) {
  logger.info('Initializing SMTP Server');
  t.verify((error) => {
    if (error) {
      logger.error('Error while connecting to SMTP Server: %s', error);
      return Promise.reject(error);
    }
    transporter = t;
    logger.info('SMTP Server ready');
    return Promise.resolve('SMTP Server ready');
  });
}

async function sendMailTo(mails: Array<string>, subject: string, html: string) {
  const info = await transporter.sendMail({
    from: config.smtp.sender,
    to: mails.join(','),
    subject: subject,
    html: html,
  });
  logger.info(`[MailSenderService] - [sendMailTo] - Email sent: ${info.messageId}`);
}

export default sendMailTo;
