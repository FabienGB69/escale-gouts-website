import type { APIRoute } from 'astro'
import { Resend } from 'resend'
import { z } from 'zod'

export const prerender = false

const resend = new Resend(import.meta.env.RESEND_API_KEY)

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

const AvisSchema = z.object({
  nom: z.string().min(1).max(80),
  email: z.string().email().max(120),
  profil: z.enum(['proprietaire', 'voyageur']),
  note: z.coerce.number().int().min(1).max(5),
  texte: z.string().min(10).max(2000),
  website: z.string().max(0).optional(), // honeypot — doit être vide
})

const ETOILES: Record<number, string> = {
  1: '⭐',  2: '⭐⭐',  3: '⭐⭐⭐',  4: '⭐⭐⭐⭐',  5: '⭐⭐⭐⭐⭐',
}

export const POST: APIRoute = async ({ request }) => {
  // Vérification Origin
  const allowedOrigins = ['https://www.escaleetgouts.fr', 'https://escaleetgouts.fr', 'http://localhost:4321']
  const origin = request.headers.get('origin') ?? ''
  if (!allowedOrigins.includes(origin)) {
    return new Response(JSON.stringify({ success: false }), { status: 403 })
  }

  const data = await request.formData()

  const rawData = {
    nom:     String(data.get('nom')     ?? '').trim(),
    email:   String(data.get('email')   ?? '').trim(),
    profil:  String(data.get('profil')  ?? '').trim(),
    note:    String(data.get('note')    ?? '').trim(),
    texte:   String(data.get('texte')   ?? '').trim(),
    website: String(data.get('website') ?? '').trim(),
  }

  // Honeypot — répondre 200 silencieux si rempli
  if (rawData.website) {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Validation Zod
  const parsed = AvisSchema.safeParse(rawData)
  if (!parsed.success) {
    return new Response(JSON.stringify({ success: false, error: 'Données invalides' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { nom, email, profil, note, texte } = parsed.data

  const etoiles     = ETOILES[note] ?? '⭐'
  const profilLabel = profil === 'voyageur' ? '🧳 Voyageur' : '🏠 Propriétaire'

  // Variable d'env Notion
  const notionDbId = import.meta.env.NOTION_DATABASE_ID
  if (!notionDbId) throw new Error('NOTION_DATABASE_ID manquant')
  const NOTION_DB_URL = `https://www.notion.so/${notionDbId.replace(/-/g, '')}`

  // ── 1. Créer l'entrée Notion ──────────────────────────────────────────────
  const notionKey = import.meta.env.NOTION_API_KEY
  if (notionKey) {
    try {
      await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionKey}`,
          'Content-Type':  'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          parent: { database_id: notionDbId },
          properties: {
            'Nom':    { title:     [{ text: { content: nom } }] },
            'Statut': { select:    { name: '⏳ En attente' } },
            'Profil': { select:    { name: profilLabel } },
            'Note':   { number:    note },
            'Avis':   { rich_text: [{ text: { content: texte } }] },
          },
        }),
      })
    } catch (e) {
      console.error('[api/avis] Notion error:', e instanceof Error ? e.message : 'unknown')
    }
  }

  // ── 2. Envoyer l'email de notification ────────────────────────────────────
  try {
    await resend.emails.send({
      from:    'Site Web Escale et Goûts <contact@escaleetgouts.fr>',
      to:      'escaleetgouts@gmail.com',
      subject: `⭐ Nouvel avis à valider — ${escapeHtml(nom)} (${note}/5)`,
      html: `
        <div style="font-family:Arial,sans-serif; max-width:600px; color:#2C2C2C;">
          <div style="background:#1B2E5E; padding:24px 32px; border-radius:8px 8px 0 0;">
            <h2 style="color:#C9983A; margin:0; font-size:20px;">Nouvel avis à valider</h2>
            <p style="color:rgba(255,255,255,0.6); margin:6px 0 0; font-size:13px;">
              Reçu via escaleetgouts.fr · En attente de votre validation
            </p>
          </div>
          <div style="background:white; padding:32px; border:1px solid #eee; border-top:none; border-radius:0 0 8px 8px;">

            <div style="background:#FAF6EF; border-radius:12px; padding:20px 24px; margin-bottom:24px; text-align:center;">
              <p style="font-size:32px; margin:0 0 4px;">${etoiles}</p>
              <p style="font-size:22px; font-weight:bold; color:#1B2E5E; margin:0;">${note} / 5</p>
            </div>

            <table style="width:100%; border-collapse:collapse;">
              <tr>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; color:#888; font-size:13px; width:40%;">Profil</td>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; font-size:14px; font-weight:bold;">${escapeHtml(profilLabel)}</td>
              </tr>
              <tr>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; color:#888; font-size:13px;">Nom</td>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; font-size:14px; font-weight:bold;">${escapeHtml(nom)}</td>
              </tr>
              <tr>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; color:#888; font-size:13px;">Email</td>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; font-size:14px;">${escapeHtml(email)}</td>
              </tr>
              <tr>
                <td style="padding:14px 0 0; color:#888; font-size:13px; vertical-align:top;">Avis</td>
                <td style="padding:14px 0 0; font-size:14px; line-height:1.7; font-style:italic; color:#444;">
                  « ${escapeHtml(texte).replace(/\n/g, '<br>')} »
                </td>
              </tr>
            </table>

            <div style="margin-top:28px; padding:16px 20px; background:#E8F0FE; border-radius:8px; border-left:3px solid #1B2E5E; text-align:center;">
              <p style="margin:0 0 12px; font-size:13px; font-weight:bold; color:#1B2E5E;">Valider ou refuser dans Notion</p>
              <a href="${NOTION_DB_URL}" style="display:inline-block; background:#1B2E5E; color:white; text-decoration:none; padding:10px 24px; border-radius:6px; font-size:13px; font-weight:bold;">
                Ouvrir la base Notion →
              </a>
            </div>

            <div style="margin-top:12px; padding:14px 20px; background:#fff8e1; border-radius:8px; border-left:3px solid #C9983A;">
              <p style="margin:0; font-size:12px; color:#888;">
                🕐 Reçu le ${new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                · Changez le statut en ✅ Validé pour publication automatique
              </p>
            </div>
          </div>
        </div>
      `,
    })

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[api/avis] Erreur:', err instanceof Error ? err.message : 'unknown')
    return new Response(JSON.stringify({ error: 'Échec envoi' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
}
