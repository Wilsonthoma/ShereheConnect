interface ResetPasswordData {
  fullName: string;
  resetUrl: string;
}

export function resetPasswordTemplate(data: ResetPasswordData): { html: string; text: string; subject: string } {
  const { fullName, resetUrl } = data;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset your ShereheConnect password</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8fafc;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border-radius:16px;box-shadow:0 10px 30px -12px rgba(0,0,0,0.15);overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#f59e0b,#ec6408);padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:400;letter-spacing:0.5px;">ShereheConnect</h1>
              <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.9);font-size:13px;text-transform:uppercase;letter-spacing:1.5px;">Password Reset</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;">
              <h2 style="margin:0 0 16px 0;font-size:22px;color:#1e293b;">Hi ${fullName},</h2>
              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#475569;">
                We received a request to reset your ShereheConnect password. Click the button below to set a new password.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px 0;">
                    <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#ec6408);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:9999px;font-weight:600;font-size:15px;">Reset Password</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px 0;font-size:13px;color:#64748b;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 24px 0;font-size:12px;color:#ec6408;word-break:break-all;background:#f8fafc;padding:12px;border-radius:8px;">
                ${resetUrl}
              </p>
              <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
                This link expires in <strong>1 hour</strong>. If you didn't request a password reset, no action is needed — your password is safe.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;background:#f8fafc;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                © 2026 ShereheConnect. Made with ❤️ in Kenya.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `Hi ${fullName},

We received a request to reset your ShereheConnect password. Visit this link to set a new password:

${resetUrl}

This link expires in 1 hour. If you didn't request this, you can ignore this email.

— ShereheConnect Team`;

  return {
    subject: 'Reset your ShereheConnect password',
    html,
    text,
  };
}
