# Escale et Goûts — Site Conciergerie Airbnb

Site web statique pour **Escale et Goûts**, conciergerie de locations courte durée sur le sud lyonnais (Vienne, Saint-Priest, Annonay).

Stack : **Astro 6 + Tailwind CSS 4 + MDX + Vercel**

---

## Structure du projet

```
src/
├── components/
│   ├── Navbar.astro
│   ├── Footer.astro
│   ├── Hero.astro
│   ├── SEO.astro
│   ├── ContactForm.astro
│   ├── EstimateurGain.astro
│   ├── LogementCard.astro
│   └── TestimonialCard.astro
├── layouts/
│   └── BaseLayout.astro
├── pages/
│   ├── index.astro
│   ├── services-conciergerie.astro
│   ├── logements-geres.astro
│   ├── temoignages.astro
│   ├── a-propos.astro
│   ├── contact.astro
│   ├── mentions-legales.astro
│   ├── conciergerie/[ville].astro   ← SEO local dynamique
│   ├── blog/index.astro
│   ├── blog/[slug].astro
│   └── api/contact.ts               ← SSR Resend email
├── content/
│   ├── logements/
│   ├── zones/
│   ├── temoignages/
│   └── blog/
├── content.config.ts
└── styles/global.css
```

---

## Démarrage local

```bash
npm install
cp .env.example .env
# → Renseigner RESEND_API_KEY dans .env
npm run dev
# → http://localhost:4321
```

---

## Variables d'environnement

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | Clé API Resend pour le formulaire de contact |

Créer un compte sur [resend.com](https://resend.com), générer une clé API.

> **DNS Resend requis** : Pour éviter le spam Gmail, ajouter les enregistrements SPF/DKIM sur IONOS depuis Resend → Domains → `escaleetgouts.fr`.

---

## Déploiement Vercel

### 1. Créer le repo GitHub
```bash
git init
git add .
git commit -m "feat: site Escale et Goûts v1"
git remote add origin https://github.com/VOTRE_COMPTE/escale-et-gouts.git
git push -u origin main
```

### 2. Import Vercel
1. [vercel.com/new](https://vercel.com/new) → Import Git Repository
2. Framework : **Astro** (auto-détecté)
3. Ajouter env var : `RESEND_API_KEY = re_xxx...`
4. Deploy

### 3. DNS IONOS → Vercel
| Type | Nom | Valeur |
|---|---|---|
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

Sur Vercel → Project Settings → Domains → Ajouter `escaleetgouts.fr` et `www.escaleetgouts.fr`.

---

## Gestion du contenu (MDX)

### Ajouter un logement
`src/content/logements/mon-logement.mdx`
```yaml
---
titre: "Appartement T3 — Vienne"
ville: "Vienne (38)"
capacite: 5
superficie: 65
services:
  - "Wifi fibre"
  - "Parking"
  - "Linge fourni"
image: "/images/logements/mon-logement.jpg"
ordre: 3
actif: true
---
```

### Ajouter un témoignage
`src/content/temoignages/prenom-n.mdx`
```yaml
---
nom: "Prénom N."
ville: "Vienne (38)"
type_bien: "T2"
note: 5
texte: "Le texte du témoignage ici."
date: "2026-01"
ordre: 4
---
```

### Ajouter un article de blog
`src/content/blog/mon-article.mdx`
```yaml
---
titre: "Titre de l'article"
description: "Meta description SEO (155 car. max)"
date: 2026-02-01
tags: ["Vienne", "conseils Airbnb"]
publie: true
---

Contenu en Markdown ici...
```

---

## Palette de couleurs

| Classe Tailwind | Hex | Usage |
|---|---|---|
| `navy` | `#1B2E5E` | Headers, fonds, texte foncé |
| `gold` | `#C9983A` | CTAs, accents, étoiles |
| `cream` | `#FAF6EF` | Fonds de sections alternés |
| `text` | `#2C2C2C` | Corps de texte |

Modifiable dans `src/styles/global.css` → bloc `@theme { }`.

---

## SEO

- Sitemap : `/sitemap-index.xml` (auto via `@astrojs/sitemap`)
- Robots : `/public/robots.txt`
- JSON-LD `LocalBusiness` : injecté sur toutes les pages via `SEO.astro`
- Pages locales : `/conciergerie/vienne/` · `/conciergerie/saint-priest/` · `/conciergerie/annonay/` · `/conciergerie/sud-lyon/`
