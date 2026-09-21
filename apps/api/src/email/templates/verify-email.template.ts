interface VerifyEmailData {
  fullName: string;
  otp: string;
  expiryMinutes: number;
}

export function verifyEmailTemplate(data: VerifyEmailData): {
  html: string;
  text: string;
  subject: string;
} {
  const { fullName, otp, expiryMinutes } = data;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your ShereheConnect verification code</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8fafc;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border-radius:16px;box-shadow:0 10px 30px -12px rgba(0,0,0,0.15);overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#f59e0b,#ec6408);padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:400;letter-spacing:0.5px;">ShereheConnect</h1>
              <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.9);font-size:13px;text-transform:uppercase;letter-spacing:1.5px;">Verify Your Email</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;text-align:center;">
              <h2 style="margin:0 0 16px 0;font-size:22px;color:#1e293b;text-align:left;">Hi ${fullName},</h2>
              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#475569;text-align:left;">
                Welcome to ShereheConnect! Enter the code below to verify your email address and activate your account.
              </p>

              <div style="background:#f8fafc;border-radius:12px;padding:24px 16px;margin:0 0 24px 0;border:2px dashed #e2e8f0;">
                <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;font-weight:600;">Your Verification Code</div>
                <div style="font-size:42px;font-weight:700;color:#ec6408;letter-spacing:12px;font-family:'Courier New',monospace;">${otp}</div>
              </div>

              <p style="margin:0 0 24px 0;font-size:14px;color:#64748b;text-align:left;">
                This code expires in <strong style="color:#1e293b;">${expiryMinutes} minutes</strong>. If you didn't create a ShereheConnect account, you can safely ignore this email.
              </p>

              <div style="padding-top:20px;border-top:1px solid #e2e8f0;text-align:left;">
                <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                  <strong>Security tip:</strong> Never share this code with anyone. ShereheConnect will never ask you for it.
                </p>
              </div>
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

Welcome to ShereheConnect!

Your email verification code is: ${otp}

This code expires in ${expiryMinutes} minutes. If you didn't create a ShereheConnect account, you can safely ignore this email.

Security tip: Never share this code with anyone.

— ShereheConnect Team`;

  return {
    subject: `Your ShereheConnect verification code: ${otp}`,
    html,
    text,
  };
}
