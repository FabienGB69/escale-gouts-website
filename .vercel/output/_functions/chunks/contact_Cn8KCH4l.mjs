import { Resend } from 'resend';

const prerender = false;
const resend = new Resend(undefined                              );
const POST = async ({ request }) => {
  const data = await request.formData();
  const nom = String(data.get("nom") ?? "").trim();
  const email = String(data.get("email") ?? "").trim();
  const telephone = String(data.get("telephone") ?? "").trim();
  const ville = String(data.get("ville") ?? "").trim();
  const nbLogements = String(data.get("nb_logements") ?? "").trim();
  const typeBien = String(data.get("type_bien") ?? "").trim();
  const message = String(data.get("message") ?? "").trim();
  if (!nom || !email || !ville) {
    return new Response(JSON.stringify({ error: "Champs requis manquants" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    await resend.emails.send({
      from: "Site Web Escale et Goûts <contact@escaleetgouts.fr>",
      to: "escaleetgouts@gmail.com",
      replyTo: email,
      subject: `Nouvelle demande de devis — ${nom} (${ville})`,
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
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; font-size:14px; font-weight:bold;">${nom}</td>
              </tr>
              <tr>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; color:#888; font-size:13px;">Email</td>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; font-size:14px;">
                  <a href="mailto:${email}" style="color:#1B2E5E;">${email}</a>
                </td>
              </tr>
              ${telephone ? `
              <tr>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; color:#888; font-size:13px;">Téléphone</td>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; font-size:14px;">${telephone}</td>
              </tr>` : ""}
              <tr>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; color:#888; font-size:13px;">Ville</td>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; font-size:14px;">${ville}</td>
              </tr>
              <tr>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; color:#888; font-size:13px;">Logements</td>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; font-size:14px;">${nbLogements}</td>
              </tr>
              ${typeBien ? `
              <tr>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; color:#888; font-size:13px;">Type de bien</td>
                <td style="padding:10px 0; border-bottom:1px solid #f5f5f5; font-size:14px;">${typeBien}</td>
              </tr>` : ""}
              ${message ? `
              <tr>
                <td style="padding:10px 0; color:#888; font-size:13px; vertical-align:top; padding-top:14px;">Message</td>
                <td style="padding:10px 0; font-size:14px; padding-top:14px; line-height:1.6;">${message.replace(/\n/g, "<br>")}</td>
              </tr>` : ""}
            </table>

            <div style="margin-top:24px; padding:16px; background:#FAF6EF; border-radius:8px; border-left:3px solid #C9983A;">
              <p style="margin:0; font-size:13px; color:#888;">
                💡 Répondre à cet email contactera directement : <strong>${email}</strong>
              </p>
            </div>
          </div>
        </div>
      `
    });
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Erreur Resend:", err);
    return new Response(JSON.stringify({ error: "Échec envoi email" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
