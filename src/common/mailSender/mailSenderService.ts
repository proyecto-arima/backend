import fs from 'fs';
import { compile } from 'handlebars';
import nodemailer from 'nodemailer';

import { logger } from '@/common/utils/serverLogger';

import { config } from '../utils/config';
import { Email } from './mailTemplateModel';

let transporter: nodemailer.Transporter;

export const buildTransporter = () => {
  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    greetingTimeout: 5000,
    secure: config.smtp.secure,
    auth: config.smtp.auth,
  });
};

export const initTransporter = (t: nodemailer.Transporter) => {
  logger.info('[MailSenderService] - [initTransporter] - Reading SMTP Server configuration');
  logger.info(`[MailSenderService] - [initTransporter] - SMTP Server: ${config.smtp.host}:${config.smtp.port}`);
  logger.info(
    `[MailSenderService] - [initTransporter] - SMTP Server login type: ${config.smtp.auth ? 'LOGIN' : 'NO LOGIN'}`
  );
  t.verify((error) => {
    if (error) {
      logger.error(`[MailSenderService] - [initTransporter] - Error: ${error}`);
      throw Error('Error initializing SMTP Server');
    }
  });
  transporter = t;
  logger.info(`[MailSenderService] - [initTransporter] - SMTP Server initialized`);
  return transporter;
};

export const mailSenderService = {
  sendMailTo: async (data: Email) => {
    if (config.app.node_env === 'test') return;
    try {
      if (!data) {
        throw Error('Email data is required');
      }
      logger.trace(`[MailSenderService] - [sendMailTo] - Sending email with data: ${JSON.stringify(data)}`);
      const filePath = `./html_templates/${data.bodyTemplateName}.html`;
      if (!fs.existsSync(filePath)) {
        logger.warn(`[MailSenderService] - [sendMailTo] - Email template not found: ${filePath}`);
        logger.warn(`[MailSenderService] - [sendMailTo] - Email not sent`);
        return;
      }
      logger.trace(`[MailSenderService] - [sendMailTo] - Reading email template from: ${filePath}`);
      const source = fs.readFileSync(filePath, 'utf8');
      const htmlContent = compile(source)(data.templateParams);
      logger.trace('[MailSenderService] - [sendMailTo] - Email template compiled successfully');

      const info = await transporter.sendMail({
        from: config.smtp.sender,
        to: data.to.join(','),
        cc: data.cc?.join(','),
        bcc: data.bcc?.join(','),
        subject: data.subject,
        html: htmlContent,
        attachments: data.attachments,
      });
      logger.info(`[MailSenderService] - [sendMailTo] - Email sent successfully: ${info.messageId}`);
      return;
    } catch (error) {
      logger.error(`[MailSenderService] - [sendMailTo] - ${error}`);
      throw Error('Error sending email');
    }
  },
};

// EXAMPLE USAGE
// mailSenderService.sendMailTo(
//   {
//     to: ['test@email.com'],
//     subject: 'Test email',
//     bodyTemplateName: 'test.html',
//     templateParams: {
//       "name": "My name",
//       "hometown": "Best place on earth",
//       "kids": [
//         { "name": "name1", "age": "51" },
//         { "name": "nam2", "age": "22" }
//       ]
//     }
//   } as Email
// );

export default mailSenderService.sendMailTo;
