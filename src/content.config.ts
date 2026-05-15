import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const publicAsset = z.string().regex(/^(\/|https?:\/\/)/);

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    id: z.number().int().positive(),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().min(1),
    date: dateString,
    updatedAt: dateString,
    category: z.string().min(1),
    summary: z.string().min(1),
    thumbnail: publicAsset,
    ogImage: publicAsset,
    sourceType: z.string().min(1),
    sourceUrls: z.array(z.string().url()).default([]),
    tags: z.array(z.string().min(1)).default([]),
    textAlign: z.enum(['left', 'center', 'right']).optional()
  })
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    page: z.string().min(1),
    lang: z.enum(['ko', 'en', 'ja']),
    title: z.string().min(1)
  })
});

export const collections = { blog, pages };
