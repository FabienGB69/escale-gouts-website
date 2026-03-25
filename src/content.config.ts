import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

// ── Logements gérés ──────────────────────────────────────────────
const logements = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/logements' }),
  schema: z.object({
    titre:      z.string(),
    ville:      z.string(),
    quartier:   z.string().optional(),
    capacite:   z.number(),
    superficie: z.number().optional(),
    services:   z.array(z.string()),
    image:       z.string(),
    accroche:    z.string().optional(),          // Phrase d'accroche affichée sur la carte
    airbnb_url:  z.string().url().optional(),   // Lien cliquable vers l'annonce Airbnb
    airbnb_id:   z.string().optional(),         // ID Airbnb pour le widget embed
    booking_url: z.string().url().optional(),   // Lien Booking.com optionnel
    ordre:       z.number().default(99),
    actif:       z.boolean().default(true),
  }),
})

// ── Zones locales (pages SEO par ville) ──────────────────────────
const zones = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/zones' }),
  schema: z.object({
    ville:       z.string(),
    slug:        z.string(),
    titre_seo:   z.string(),
    description: z.string(),
    h1:          z.string(),
    departement: z.string().optional(),
    image:       z.string().optional(),
  }),
})

// ── Témoignages propriétaires ─────────────────────────────────────
const temoignages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/temoignages' }),
  schema: z.object({
    nom:       z.string(),
    ville:     z.string(),
    type_bien: z.string().optional(),
    note:      z.number().min(1).max(5).default(5),
    texte:     z.string(),
    date:      z.string().optional(),
    ordre:     z.number().default(99),
  }),
})

// ── Blog SEO ──────────────────────────────────────────────────────
const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    titre:       z.string(),
    description: z.string(),
    date:        z.date(),
    image:       z.string().optional(),
    tags:        z.array(z.string()).default([]),
    publie:      z.boolean().default(true),
  }),
})

export const collections = { logements, zones, temoignages, blog }
