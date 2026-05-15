import { getCollection } from 'astro:content';
import { marked } from 'marked';
import siteData from '../../data/data.json';

export const langs = ['ko', 'en', 'ja'] as const;
export type Lang = (typeof langs)[number];

export const koreanOnlyPages = ['about', 'blog', 'post'] as const;
export type PageKey = 'home' | 'about' | 'blog' | 'post' | 'privacy' | 'terms';

export type PostMeta = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  category: string;
  date: string;
  updatedAt: string;
  thumbnail: string;
  ogImage: string;
  sourceType: string;
  sourceUrls: string[];
  tags: string[];
  body: string;
  collectionId: string;
  textAlign?: 'left' | 'center' | 'right';
  filePath?: string;
};

export const data = siteData;

type BlogEntry = {
  id: string;
  body?: string;
  filePath?: string;
  data: Omit<PostMeta, 'body' | 'collectionId' | 'filePath'>;
};

type PageEntry = {
  body?: string;
  data: {
    page: string;
    lang: Lang;
    title: string;
  };
};

export function isLang(value: string | undefined): value is Lang {
  return Boolean(value && langs.includes(value as Lang));
}

export function getLocalizedValue(value: unknown, lang: Lang, fallback = ''): string {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const values = value as Record<string, string>;
    return values[lang] || values.ko || fallback;
  }
  return fallback;
}

export function getPageSeo(pageKey: PageKey, lang: Lang) {
  const meta = data.meta;
  const seoLang: Lang = koreanOnlyPages.includes(pageKey as (typeof koreanOnlyPages)[number]) ? 'ko' : lang;
  const page = meta.pages[pageKey] || meta.pages.home;

  return {
    lang: seoLang,
    title: getLocalizedValue(page.title, seoLang, getLocalizedValue(meta.title, seoLang, 'EastFever')),
    description: getLocalizedValue(page.description, seoLang, getLocalizedValue(meta.description, seoLang, 'EastFever')),
    image: meta.image,
    siteName: meta.siteName,
    locale: getLocale(seoLang),
    type: pageKey === 'post' ? 'article' : 'website'
  };
}

export function getLocale(lang: Lang) {
  return {
    ko: 'ko_KR',
    en: 'en_US',
    ja: 'ja_JP'
  }[lang];
}

export function absoluteUrl(pathname: string) {
  const base = data.meta.baseUrl.replace(/\/$/, '');
  return `${base}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}

export function getHomePath(lang: Lang) {
  return `/${lang}/`;
}

export function getPagePath(pageKey: PageKey, lang: Lang) {
  if (pageKey === 'home') return getHomePath(lang);
  if (pageKey === 'about') return '/ko/about/';
  if (pageKey === 'blog') return '/ko/blog/';
  return `/${lang}/${pageKey}/`;
}

export function getAlternates(pageKey: PageKey, lang: Lang) {
  if (koreanOnlyPages.includes(pageKey as (typeof koreanOnlyPages)[number])) {
    const path = getPagePath(pageKey, 'ko');
    return [{ lang: 'ko', href: absoluteUrl(path) }];
  }

  return [
    ...langs.map(item => ({ lang: item, href: absoluteUrl(getPagePath(pageKey, item)) })),
    { lang: 'x-default', href: absoluteUrl(getPagePath(pageKey, 'ko')) }
  ];
}

export async function getSortedPosts() {
  const entries = (await getCollection('blog')) as BlogEntry[];

  return entries.map(entry => ({
    ...entry.data,
    body: entry.body || '',
    collectionId: entry.id,
    filePath: entry.filePath
  })).sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    return Number(b.id) - Number(a.id);
  });
}

export function postSlug(post: PostMeta) {
  return post.slug;
}

export function legacyPostSlug(post: PostMeta) {
  return String(post.id).padStart(3, '0');
}

export function postPath(post: PostMeta) {
  return `/ko/blog/${postSlug(post)}/`;
}

export function legacyPostPath(post: PostMeta) {
  return `/ko/blog/${legacyPostSlug(post)}/`;
}

export async function getLegacyPostMap() {
  const posts = await getSortedPosts();
  return Object.fromEntries(posts.map(post => [String(post.id), postPath(post)]));
}

export async function findPostBySlug(slug: string) {
  const posts = await getSortedPosts();
  return posts.find(post => postSlug(post) === slug || legacyPostSlug(post) === slug);
}

export async function readAboutMarkdown() {
  const pages = (await getCollection('pages')) as PageEntry[];
  const about = pages.find(page => page.data.page === 'about' && page.data.lang === 'ko');

  if (!about) {
    throw new Error('Missing about page content for ko.');
  }

  return about.body || '';
}

export function stripFrontmatter(markdown: string) {
  return markdown.replace(/^---[\s\S]*?---/, '').trim();
}

export function stripFirstHeading(markdown: string) {
  return markdown.replace(/^(\s*#\s+[^\r\n]*)/, '').trim();
}

export function renderMarkdown(markdown: string, options: { breaks?: boolean } = {}) {
  return marked.parse(markdown, { async: false, ...options }) as string;
}

export function renderPostMarkdown(post: PostMeta) {
  const markdown = stripFirstHeading(stripFrontmatter(post.body));
  return renderMarkdown(replaceOgCards(markdown), { breaks: true });
}

export function resolveAssetPath(value: string | undefined) {
  if (!value) return '';
  if (/^https?:\/\//.test(value) || value.startsWith('/')) return value;
  return `/${value}`;
}

export function absoluteImageUrl(value: string | undefined) {
  if (!value) return data.meta.image;
  if (/^https?:\/\//.test(value)) return value;
  return absoluteUrl(resolveAssetPath(value));
}

export function getPostImage(post: PostMeta) {
  const candidate = post.ogImage || post.thumbnail || extractFirstImage(post.body);
  return absoluteImageUrl(candidate);
}

export function getPostMedia(post: PostMeta) {
  const src = post.thumbnail || extractFirstImage(post.body);
  if (!src) return null;
  return { type: 'image', src: resolveAssetPath(src), alt: post.title };
}

export function parseFrontmatter(markdown: string) {
  const match = /^---\s*\n([\s\S]*?)\n---/.exec(markdown);
  if (!match) return {} as Record<string, string>;

  return match[1].split(/\r?\n/).reduce((frontmatter, line) => {
    const field = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!field) return frontmatter;

    const key = field[1].trim();
    let value = field[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    frontmatter[key] = value;
    return frontmatter;
  }, {} as Record<string, string>);
}

function extractFirstImage(markdown: string) {
  const image = /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/.exec(markdown);
  if (image) return image[1];

  const htmlImage = /<img[^>]+src=["']([^"']+)["'][^>]*>/i.exec(markdown);
  if (htmlImage) return htmlImage[1];

  return '';
}

function replaceOgCards(markdown: string) {
  return markdown.replace(/^::og-card\{([^}\n]+)\}[ \t]*$/gm, (_match, attrText: string) => {
    const attrs = parseInlineAttrs(attrText);
    const url = attrs.url;
    if (!url) return '';

    const service = data.services.find(item => item.url?.replace(/\/$/, '') === url.replace(/\/$/, ''));
    const title = attrs.title || getLocalizedValue(service?.name, 'ko') || url;
    const description = attrs.description || getLocalizedValue(service?.description, 'ko') || url;
    const image = resolveAssetPath(attrs.image || service?.thumbnail || '');

    return `<div class="og-card-wrap">
  <a class="og-card" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">
    ${image ? `<img class="og-card-image" src="${escapeHtml(image)}" alt="">` : ''}
    <span class="og-card-content">
      <strong class="og-card-title">${escapeHtml(title)}</strong>
      <span class="og-card-description">${escapeHtml(description)}</span>
      <span class="og-card-url">${escapeHtml(url)}</span>
    </span>
  </a>
</div>`;
  });
}

function parseInlineAttrs(value: string) {
  const attrs: Record<string, string> = {};
  const attrPattern = /([\w-]+)\s*=\s*"([^"]*)"|([\w-]+)\s*=\s*'([^']*)'/g;
  let match;

  while ((match = attrPattern.exec(value)) !== null) {
    attrs[match[1] || match[3]] = decodeHtmlEntities(match[2] || match[4] || '');
  }

  return attrs;
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function escapeHtml(value: string) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char] || char);
}
