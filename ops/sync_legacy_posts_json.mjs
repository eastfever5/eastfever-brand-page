#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const rootDir = process.cwd();
const blogDir = path.join(rootDir, 'src/content/blog');
const outputPath = path.join(rootDir, 'data/posts.json');

function parseEntry(file) {
  const markdown = fs.readFileSync(path.join(blogDir, file), 'utf8');
  const match = /^---\s*\n([\s\S]*?)\n---/.exec(markdown);

  if (!match) {
    throw new Error(`${file} is missing frontmatter.`);
  }

  const data = yaml.load(match[1]) || {};
  return {
    id: data.id,
    title: data.title,
    summary: data.summary,
    category: data.category,
    date: data.date,
    file,
    slug: data.slug,
    ...(Array.isArray(data.sourceUrls) && data.sourceUrls.length > 0
      ? { source: data.sourceUrls[data.sourceUrls.length - 1] }
      : {})
  };
}

const posts = fs.readdirSync(blogDir)
  .filter(file => /^\d{3}\.md$/.test(file))
  .sort()
  .map(parseEntry)
  .sort((a, b) => a.id - b.id);

fs.writeFileSync(outputPath, `${JSON.stringify({ posts }, null, 2)}\n`, 'utf8');
console.log(`Synced ${posts.length} posts to data/posts.json`);
