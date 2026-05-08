import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db';
import * as schema from '@/db/schema';

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'https://movie-full-stack-project-three.vercel.app';

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!apiKey || !senderEmail) {
    console.warn('[email] BREVO_API_KEY / BREVO_SENDER_EMAIL eksik — email gönderilmedi:', to);
    return;
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'MovieTrack', email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('[email] Brevo hatası:', err);
    throw new Error('Email gönderilemedi');
  }
  console.log('[email] Gönderildi:', to);
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlaceholder: false,
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),

  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail(
        user.email,
        'MovieTracker — Şifre Sıfırlama',
        `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0a0a0a;color:#f1f5f9;padding:32px;border-radius:16px;border:1px solid rgba(255,85,0,0.2)">
          <h2 style="margin:0 0 8px;font-size:22px">Şifre Sıfırlama</h2>
          <p style="color:#71717a;margin:0 0 24px">Şifreni sıfırlamak için aşağıdaki butona tıkla. Link 1 saat geçerlidir.</p>
          <a href="${url}" style="display:inline-block;background:#ff5500;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700">Şifremi Sıfırla</a>
          <p style="color:#3f3f46;margin-top:24px;font-size:12px">Bu emaili sen talep etmediysen yoksay.</p>
        </div>
        `,
      );
    },
  },

  trustedOrigins: [
    'http://localhost:5173',
    `${FRONTEND_URL}`,
  ],
});
