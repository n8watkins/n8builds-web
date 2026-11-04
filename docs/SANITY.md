# Sanity: how the blog's content reaches the site

N8's Notions, the build log highlights and the live switch are written in the Sanity Studio (`n8watkins/n8builds-studio`, hosted at https://n8builds.sanity.studio).
The content lives in Sanity project `abgyc32w`, dataset `production`.
This site only reads it (`lib/sanity.ts`).

## Backups

The dataset is backed up every night at 04:40 UTC by `.github/workflows/sanity-backup.yml`.

- **What:** `sanity datasets export`: every document (drafts included) and every image and file, as one `.tar.gz` (about 12 MB in November 2026).
- **Where:** the private R2 bucket `n8builds-sanity-backups`, at `production/<YYYY-MM-DD>.tar.gz`.
  It has no public `r2.dev` URL and no custom domain; only the owner's Cloudflare account can read it.
- **How long:** a lifecycle rule (`keep-30-days`) deletes each backup after 30 days.
- **Checked:** before uploading, the workflow opens the tarball and fails if it has no posts or if any image a document points to is missing.
  A failed scheduled run opens a "Sanity backup failed" issue.
- **Secrets:** `SANITY_BACKUP_TOKEN` (a Sanity robot token with the Viewer role, "n8builds-web nightly backup (GitHub Actions)" in Manage > API > Tokens) and the deploy's `CLOUDFLARE_API_TOKEN` (its R2 permission writes the object).
  Nothing is kept on the runner or uploaded as a workflow artifact, because this repository is public.

### Restoring

```bash
npx wrangler r2 object get n8builds-sanity-backups/production/<date>.tar.gz --file backup.tar.gz --remote
# Into a new dataset first, to check it (free plans make every dataset publicly readable, but drafts stay private):
npx sanity datasets create restore-check
npx sanity datasets import backup.tar.gz restore-check
# Then, once it looks right, over production (replaces documents with the same ids):
npx sanity datasets import backup.tar.gz production --replace
npx sanity datasets delete restore-check
```

Run the `sanity` commands in `n8builds-studio` (or anywhere with `--project abgyc32w`), logged in with `npx sanity login`.
A restore was tested on 2026-11-04: the backup imported into a throwaway dataset with all 12 documents (4 published posts, 4 drafts, the live switch, 3 AI Assist states) and all 20 images, the posts matched production field for field, and the throwaway dataset was deleted.
