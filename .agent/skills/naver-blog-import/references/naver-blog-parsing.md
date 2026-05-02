# Naver Blog Parsing Notes

## Verified Source

- Desktop post URL: returns a frameset/iframe shell.
- RSS URL: returns metadata and truncated descriptions.
- Mobile post URL: returns usable SmartEditor HTML.

Preferred URL:

```text
https://m.blog.naver.com/{blogId}/{logNo}
```

## Extraction Targets

- Title: `og:title`
- Summary: `og:description`
- Category: `.blog_category`, fallback `gsCategoryName`
- Published date: `.blog_date`
- Tags: `var gsTagName = "...";`
- Body root: `<div class="se-main-container">`

## Supported Components

- `se-text`: converted to paragraph lines.
- `se-image`: converted to markdown image with the public Naver image URL.
- `se-oglink`: converted to blockquote link cards.
- `se-video`: converted to a placeholder containing the Naver video id.
- `se-horizontalLine`: converted to `---`.

Unsupported components should produce warnings rather than failing the whole import.
