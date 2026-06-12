import { ContactFormData } from '@/lib/validations/contact'
import { subjectOptions } from '@/lib/validations/contact'
import { EMAIL_CONFIG } from '@/lib/email/smtp'
// Security: escape ALL markup in user input. Stricter than the previous
// DOMPurify allowlist (which permitted bare <br>), and avoids jsdom —
// whose dependency chain breaks Vercel's serverless runtime
// (ERR_REQUIRE_ESM in html-encoding-sniffer). Newlines in the message
// still render via `white-space: pre-wrap` on the message box.
function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function createContactEmailHtml(data: ContactFormData): string {
  const subjectLabel = subjectOptions.find(opt => opt.value === data.subject)?.label || data.subject
  const timestamp = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  })

  // Get urgency level and suggested action based on subject
  function getSubjectInsights(subject: string) {
    switch (subject) {
      case 'project_opportunity':
        return {
          urgency: '🟢 High Priority',
          action: 'Review project scope and respond within 24h',
          context: 'New project inquiry'
        }
      case 'consulting':
        return {
          urgency: '🟡 Medium Priority',
          action: 'Assess consulting fit and availability',
          context: 'Consulting opportunity'
        }
      case 'networking':
        return {
          urgency: '🔵 Low Priority',
          action: 'Connect and engage',
          context: 'Networking contact'
        }
      default:
        return {
          urgency: '🟠 Standard',
          action: 'Review and respond',
          context: 'Contact inquiry'
        }
    }
  }

  const insights = getSubjectInsights(data.subject)

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>New Contact - ${sanitizeHtml(data.name)}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background: #f6f7fb;
          }
          .container { max-width: 600px; margin: 0 auto; padding: 16px; }
          .header {
            background: linear-gradient(135deg, #06b6d4 0%, #2563eb 100%);
            color: white;
            padding: 24px;
            border-radius: 12px 12px 0 0;
            text-align: center;
          }
          .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
          .header p { margin: 8px 0 0; font-size: 16px; opacity: 0.9; }
          .content {
            background: white;
            padding: 24px;
            border-radius: 0 0 12px 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .priority-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 16px;
            background: #f0f9ff;
            color: #0284c7;
            border: 1px solid #e0f2fe;
          }
          .contact-info {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #3b82f6;
          }
          .contact-name { font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
          .contact-email { color: #3b82f6; font-size: 16px; text-decoration: none; }
          .contact-company { color: #64748b; font-size: 14px; margin-top: 4px; }
          .field { margin: 20px 0; }
          .field-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .label { font-weight: 700; color: #374151; font-size: 14px; }
          .action-needed {
            font-size: 12px;
            color: #059669;
            background: #d1fae5;
            padding: 4px 8px;
            border-radius: 12px;
            font-weight: 600;
          }
          .value {
            padding: 12px 16px;
            background: #f9fafb;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
            font-size: 14px;
          }
          .message-box {
            padding: 20px;
            background: #fefefe;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            white-space: pre-wrap;
            font-size: 15px;
            line-height: 1.7;
            color: #374151;
          }
          .insights {
            background: linear-gradient(135deg, #fef3c7, #fde68a);
            padding: 16px;
            border-radius: 8px;
            margin-top: 20px;
            border-left: 4px solid #f59e0b;
          }
          .insights h3 { margin: 0 0 8px; color: #92400e; font-size: 16px; }
          .insights p { margin: 4px 0; color: #451a03; font-size: 14px; }
          .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
          .footer p { font-size: 12px; color: #6b7280; margin: 0; }
          .quick-actions {
            background: #f0f9ff;
            padding: 16px;
            border-radius: 8px;
            margin-top: 16px;
            border-left: 4px solid #0ea5e9;
          }
          .quick-actions h4 { margin: 0 0 8px; color: #0c4a6e; font-size: 14px; }
          .quick-actions p { margin: 0; font-size: 13px; color: #075985; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 New opportunity</h1>
            <p>${insights.context}</p>
          </div>

          <div class="content">

            <div class="contact-info">
              <div class="contact-name">${sanitizeHtml(data.name)}</div>
              <a href="mailto:${sanitizeHtml(data.email)}" class="contact-email">${sanitizeHtml(data.email)}</a>
            </div>

            <div class="field">
              <div class="label">💼 Inquiry Type</div>
              <div class="value">${subjectLabel}</div>
            </div>

            <div class="field">
              <div class="label">💬 Message</div>
              <div class="message-box">${sanitizeHtml(data.message)}</div>
            </div>


            <div class="footer">
              <p>📧 Received via ${EMAIL_CONFIG.siteDomain} contact form</p>
              <p>🕐 ${timestamp}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}

// Per-subject middle line of the auto-reply. First and last lines are the
// same for everyone; only this second line changes with the inquiry type.
export function getSubjectSpecificLine(subject: string): { html: string; text: string } {
  switch (subject) {
    case 'project_opportunity':
      return {
        html: `If you've got a brief or a Loom, replying with that helps.`,
        text: `If you've got a brief or a Loom, replying with that helps.`,
      }
    case 'consulting':
      return {
        html: `For consulting work, a quick scope of goals and timeline will help me frame recommendations — reply with any details you can.`,
        text: `For consulting work, a quick scope of goals and timeline will help me frame recommendations — reply with any details you can.`,
      }
    case 'networking':
      return {
        html: `Always happy to connect. Here's my <a href="${EMAIL_CONFIG.linkedinUrl}" style="color:#2563eb;">LinkedIn</a> and <a href="${EMAIL_CONFIG.xUrl}" style="color:#2563eb;">X</a> if you'd like to stay in touch.`,
        text: `Always happy to connect. Here's my LinkedIn (${EMAIL_CONFIG.linkedinUrl}) and X (${EMAIL_CONFIG.xUrl}) if you'd like to stay in touch.`,
      }
    default:
      return { html: '', text: '' }
  }
}

export function createAutoReplyHtml(data: ContactFormData): string {
  const sanitizedName = sanitizeHtml(data.name)
  const firstName = sanitizedName.split(' ')[0] || 'there'
  const subjectLine = getSubjectSpecificLine(data.subject)

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Got your message</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f6f7fb;font-family:Segoe UI,Arial,sans-serif;">
  <!-- Preheader (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    Appreciate you reaching out — I normally reply within 24 hours.
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f7fb;">
    <tr>
      <td align="center" style="padding:16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:14px;border:1px solid #e5e7eb;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:20px 24px;background:linear-gradient(135deg,#06b6d4,#2563eb);color:#fff;">
              <h1 style="margin:0;font-size:22px;font-weight:600;">👋 Got your message</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 12px;font-size:16px;color:#111827;">Hey ${sanitizeHtml(firstName)},</p>

              <p style="margin:0 0 12px;font-size:15px;color:#374151;">
                Appreciate you reaching out — I normally reply within <strong>24 hours</strong>. Excited to hear more.
              </p>

              ${subjectLine.html ? `<p style="margin:0 0 12px;font-size:15px;color:#374151;">${subjectLine.html}</p>` : ''}

              <p style="margin:0 0 12px;font-size:15px;color:#374151;">
                Looking forward to connecting!
              </p>

              <!-- Signature -->
              <p style="margin:20px 0 0;font-size:15px;color:#111827;font-weight:600;">– Nathan "n8" Watkins</p>
              <p style="margin:4px 0 0;font-size:13px;color:#374151;">Full Stack AI Developer</p>
              <p style="margin:4px 0 0;font-size:13px;">
                <a href="mailto:${EMAIL_CONFIG.contactEmail}" style="color:#2563eb;">${EMAIL_CONFIG.contactEmail}</a>
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:12px;">
                <tr>
                  <td style="padding-right:14px;">
                    <a href="${EMAIL_CONFIG.linkedinUrl}">
                      <img src="${EMAIL_CONFIG.siteUrl}/email/linkedin.png" width="22" height="22" alt="LinkedIn" style="display:block;border:0;">
                    </a>
                  </td>
                  <td style="padding-right:14px;">
                    <a href="${EMAIL_CONFIG.githubUrl}">
                      <img src="${EMAIL_CONFIG.siteUrl}/email/github.png" width="22" height="22" alt="GitHub" style="display:block;border:0;">
                    </a>
                  </td>
                  <td>
                    <a href="${EMAIL_CONFIG.xUrl}">
                      <img src="${EMAIL_CONFIG.siteUrl}/email/x.png" width="22" height="22" alt="X" style="display:block;border:0;">
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:0 24px 16px;">
              <p style="margin:0;font-size:11px;color:#9aa3af;">
                One-time email — you submitted the contact form on <a href="${EMAIL_CONFIG.siteUrl}" style="color:#9aa3af;">${EMAIL_CONFIG.siteDomain}</a>. Not a subscription.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}