import type { APIRoute } from 'astro'
import { Resend } from 'resend'
import { z } from 'zod'

export const prerender = false // SSR requis pour cette route

const resend = new Resend(import.meta.env.RESEND_API_KEY)

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

const ContactSchema = z.object({
  nom: z.string().min(1).max(80),
  email: z.string().email().max(120),
  telephone: z.string().max(20).optional().default(''),
  ville: z.string().max(80).optional().default(''),
  nbLogements: z.string().max(10).optional().default(''),
  typeBien: z.string().max(50).optional().default(''),
  message: z.string().min(1).max(2000),
  website: z.string().max(0).optional(), // honeypot — doit être vide
})

export const POST: APIRoute = async ({ request }) => {
  // Vérification Origin
  const allowedOrigins = ['https://www.escaleetgouts.fr', 'https://escaleetgouts.fr', 'http://localhost:4321']
  const origin = request.headers.get('origin') ?? ''
  if (!allowedOrigins.includes(origin)) {
    return new Response(JSON.stringify({ success: false }), { status: 403 })
  }

  const data = await request.formData()

  const rawData = {
    nom:         String(data.get('nom')         ?? '').trim(),
    email:       String(data.get('email')        ?? '').trim(),
    telephone:   String(data.get('telephone')    ?? '').trim(),
    ville:       String(data.get('ville')        ?? '').trim(),
    nbLogements: String(data.get('nb_logements') ?? '').trim(),
    typeBien:    String(data.get('type_bien')    ?? '').trim(),
    message:     String(data.get('message')      ?? '').trim(),
    website:     String(data.get('website')      ?? '').trim(),
  }

  // Honeypot — répondre 200 silencieux si rempli
  if (rawData.website) {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Validation Zod
  const parsed = ContactSchema.safeParse(rawData)
  if (!parsed.success) {
    return new Response(JSON.stringify({ success: false, error: 'Données invalides' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { nom, email, telephone, ville, nbLogements, typeBien, message } = parsed.data

  // Validation email stricte
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  if (!emailRegex.test(email)) {
    return new Response(JSON.stringify({ success: false, error: 'Email invalide' }), { status: 400 })
  }

  try {
    await resend.emails.send({
      from: 'Site Web Escale et Goûts <contact@escaleetgouts.fr>',
      to:   'escaleetgouts@gmail.com',
      replyTo: email,
      subject: `Nouvelle demande de devis — ${escapeHtml(nom)} (${escapeHtml(ville)})`,
      html: `
        <div style="font-family:Arial,sans-serif; max-width:600px; color:#2C2C2C;">
          <div style="background:#1B2E5E; padding:24px 32px; border-radius:8px 8px 0 0;">
            <h2 style="color:#C9983A; margin:0; font-size:20px;">
              Nouvelle demande de devis
            </h2>
            <p style="color:rgba(255,255,255,0.6); margin:4px 0 0; font-size:13px;">
              Via escaleetgouts.fr
            </p>
          </div>
          <div style="background:white; padding:32px; border:1px solid #eee; border-top:none; border-radius:0 0 8px 8px;">
            <table style="width:100%; border-collapse:collapse;">
              <tr>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; color:#888; font-size:13px; width:40%;">Nom</td>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; font-size:14px; font-weight:bold;">${escapeHtml(nom)}</td>
              </tr>
              <tr>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; color:#888; font-size:13px;">Email</td>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; font-size:14px;">
                  <a href="mailto:${escapeHtml(email)}" style="color:#1B2E5E;">${escapeHtml(email)}</a>
                </td>
              </tr>
              ${telephone ? `
              <tr>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; color:#888; font-size:13px;">Téléphone</td>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; font-size:14px;">${escapeHtml(telephone)}</td>
              </tr>` : ''}
              <tr>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; color:#888; font-size:13px;">Ville</td>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; font-size:14px;">${escapeHtml(ville)}</td>
              </tr>
              <tr>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; color:#888; font-size:13px;">Logements</td>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; font-size:14px;">${escapeHtml(nbLogements)}</td>
              </tr>
              ${typeBien ? `
              <tr>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; color:#888; font-size:13px;">Type de bien</td>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; font-size:14px;">${escapeHtml(typeBien)}</td>
              </tr>` : ''}
              ${message ? `
              <tr>
                <td style="padding:10px 0; color:#888; font-size:13px; vertical-align:top; padding-top:14px;">Message</td>
                <td style="padding:10px 0; font-size:14px; padding-top:14px; line-height:1.6;">${escapeHtml(message).replace(/\n/g, '<br>')}</td>
              </tr>` : ''}
            </table>

            <div style="margin-top:24px; padding:16px; background:#FAF6EF; border-radius:8px; border-left:3px solid #C9983A;">
              <p style="margin:0; font-size:13px; color:#888;">
                💡 Répondre à cet email contactera directement : <strong>${escapeHtml(email)}</strong>
              </p>
            </div>
          </div>
        </div>
      `,
    })

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[api/contact] Erreur:', err instanceof Error ? err.message : 'unknown')
    return new Response(JSON.stringify({ error: 'Échec envoi email' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
