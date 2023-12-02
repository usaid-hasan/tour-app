import { env } from 'node:process';
import { htmlToText } from 'html-to-text';
import nodemailer from 'nodemailer';
import nunjucks from 'nunjucks';
import mjml2html from 'mjml';

export default class Email {
  static {
    this.from = `${env.APP_NAME} <${env.EMAIL_ID}>`;
    this.tansporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      auth: {
        user: env.EMAIL_USERNAME,
        pass: env.EMAIL_PASSWORD,
      },
    });
  }

  constructor({ name, email }) {
    this.email = email;
    this.name = name.split(' ').at(0);
    this.to = `${name} <${email}>`;
  }

  async sendWelcome(dashboardUrl) {
    return await this.#sendEmail('welcome', {
      subject: 'We welcome you to our group!',
      preview: 'We\'re thrilled to have you on board',
      dashboardUrl,
    });
  }

  async sendPasswordResetToken(url, apiUrl) {
    return await this.#sendEmail('token', {
      subject: 'Your password reset token',
      preview: 'Valid for only (10) minutes',
      url,
      apiUrl,
    });
  }

  async #sendEmail(template, context) {
    const mjml = nunjucks.render(`email/${template}.njk`, {
      name: this.name,
      ...context,
    });

    const { html } = mjml2html(mjml);
    const text = htmlToText(mjml, {
      selectors: [
        { selector: 'mj-button', format: 'anchor', options: { linkBrackets: ['[', ']'] } },
        { selector: 'mj-title', format: 'heading' },
        { selector: '*', format: 'block' },
      ],
    });

    return await Email.tansporter.sendMail({
      from: Email.from,
      to: this.to,
      subject: context.subject,
      html,
      text,
    });
  }
}
