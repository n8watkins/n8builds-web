# Plan: N8 Notions and X articles

Written 2026-10-24.
Status: recommendation; nothing built yet.

## The question

You'll write articles on X, and want them on n8builds.dev (in Sanity) too.

## What X allows (checked 2026-10-24, from third-party write-ups; confirm on docs.x.com)

- The X API has no free tier for new developers; it is pay-per-use: about $0.005 per post read, $0.015 per post created, and $0.20 for a post that contains a link.
- The official API does not return the body of an X Article, only a short link to it; getting the text means a paid third-party scraper, which can break whenever X changes its pages.

So pulling articles from X into Sanity automatically is paid, fragile and incomplete (images and formatting don't come through cleanly).

## Recommendation: publish on your site first, share to X

This is the "publish on your own site, syndicate elsewhere" pattern.

1. **Write the article in the Sanity Studio** as an N8 Notions post. Your site is the original: it ranks in search under your domain, it outlives any platform change, and it gets the share cards we built.
2. **Share it to X** in one of two ways:
   - **Free:** a "Share on X" button in the Studio (and on each post) that opens X with the title, the link and a short summary filled in; you press Post.
   - **Automatic (paid, small):** when a post is published, the site posts it to X for you. At about $0.20 per post with a link, four articles a month is under a dollar. It needs an X developer account with a little prepaid credit.
3. **Optional: also publish the full text as an X Article.** The Studio gets a "Copy for X" action that copies the post as clean text and images ready to paste into X's article editor, with a line at the end linking back to the original.

## If you'd rather write on X first

Two options, both free:

- **"On X" entries in N8 Notions:** in the Studio, paste the X Article's link, title, a short summary and a cover image. It appears in the blog list and the homepage strip with an "On X" badge and opens the article on X. No copying, no duplicate content.
- **Manual import:** paste the article's text into a new Sanity post (the Studio keeps headings, links and lists); set it to say "originally published on X" with a link.

Not recommended: automatic import through a scraper (paid, breaks without warning, loses formatting).

## What I'd build

1. A "Share on X" button on every post page and a "Share on X" / "Copy for X" action in the Studio.
2. An "On X" post type in Sanity (link, title, summary, cover, date) shown in N8 Notions with a badge.
3. Optional, if you want it: automatic posting to X when a post is published (needs an X developer account and API credit).

## What I need from you

- Which way you want to work: site first (recommended) or X first.
- If you want automatic posting: an X developer account (developer.x.com) with a small prepaid credit, and its API keys added to Vercel.
