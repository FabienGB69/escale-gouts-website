import type { APIRoute } from 'astro'
import { Resend } from 'resend'

export const prerender = false

const resend = new Resend(import.meta.env.RESEND_API_KEY)

const NOTION_DB_ID   = 'be89ef0348264fa3924ccb34602d06e2'
const NOTION_DB_URL  = 'https://www.notion.so/be89ef0348264fa3924ccb34602d06e2'

const ETOILES: Record<string, string> = {
  '1': '⭐',  '2': '⭐⭐',  '3': '⭐⭐⭐',  '4': '⭐⭐⭐⭐',  '5': '⭐⭐⭐⭐⭐',
}

export const POST: APIRoute = async ({ request }) => {
  const data = await request.formData()

  const profil  = String(data.get('profil')  ?? '').trim()
  const nom     = String(data.get('nom')     ?? '').trim()
  const ville   = String(data.get('ville')   ?? '').trim()
  const note    = String(data.get('note')    ?? '').trim()
  const texte   = String(data.get('texte')   ?? '').trim()

  if (!nom || !texte || !note) {
    return new Response(JSON.stringify({ error: 'Champs requis manquants' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })
  }

  const noteNum     = parseInt(note, 10)
  const etoiles     = ETOILES[note] ?? '⭐'
  const profilLabel = profil === 'voyageur' ? '🧳 Voyageur' : '🏠 Propriétaire'

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
          parent: { database_id: NOTION_DB_ID },
          properties: {
            'Nom':    { title:     [{ text: { content: nom } }] },
            'Statut': { select:    { name: '⏳ En attente' } },
            'Profil': { select:    { name: profilLabel } },
            'Note':   { number:    noteNum },
            'Ville':  { rich_text: [{ text: { content: ville || '' } }] },
            'Avis':   { rich_text: [{ text: { content: texte } }] },
          },
        }),
      })
    } catch (e) {
      console.error('Notion error:', e)
    }
  }

  // ── 2. Envoyer l'email de notification ────────────────────────────────────
  try {
    await resend.emails.send({
      from:    'Site Web Escale et Goûts <contact@escaleetgouts.fr>',
      to:      'escaleetgouts@gmail.com',
      subject: `⭐ Nouvel avis à valider — ${nom} (${note}/5)`,
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
              <p style="font-size:22px; font-weight:bold; color:#1B2E5E; margin:0;">${noteNum} / 5</p>
            </div>

            <table style="width:100%; border-collapse:collapse;">
              <tr>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; color:#888; font-size:13px; width:40%;">Profil</td>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; font-size:14px; font-weight:bold;">${profilLabel}</td>
              </tr>
              <tr>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; color:#888; font-size:13px;">Nom</td>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; font-size:14px; font-weight:bold;">${nom}</td>
              </tr>
              ${ville ? `<tr>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; color:#888; font-size:13px;">Ville</td>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; font-size:14px;">${ville}</td>
              </tr>` : ''}
              <tr>
                <td style="padding:14px 0 0; color:#888; font-size:13px; vertical-align:top;">Avis</td>
                <td style="padding:14px 0 0; font-size:14px; line-height:1.7; font-style:italic; color:#444;">
                  « ${texte.replace(/\n/g, '<br>')} »
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
    console.error('Erreur Resend avis:', err)
    return new Response(JSON.stringify({ error: 'Échec envoi' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
}
