# Actions minutes monitor

GitHub Free includes $12 of Actions compute a month for private repos: 2,000 minutes on a standard Linux runner.
Windows costs about 1.7x and macOS about 10x as much per minute, and public repos (like this one) are free.
Billing stays off (owner, 2026-11-09), so when the allowance runs out, private repos stop running Actions until the 1st.
The **Actions minutes** workflow (`.github/workflows/actions-usage.yml`, script `scripts/actions-usage.mjs`) gives early warning instead.

## What it does

Every day at 14:23 UTC (and on "Run workflow"), it reads this month's usage report and leaves out the public repos.
Minutes are counted as Linux minutes: each repo's cost divided by the Linux rate, which is how the allowance is spent.
It writes the total, the pace and every private repo's minutes to the run's summary.

It alerts when:

- the month so far is more than 25% ahead of an even pace (2,000 x the share of the month gone), once at least 100 minutes are used;
- the last 7 days (this month only) used more than the weekly budget (2,000 / weeks in the month, about 465);
- the total crosses 50%, 75%, 90% or 100%.

Each alert fires once a month.
The first alert opens an issue labelled `actions-usage`, assigned to n8watkins; later ones comment on it with an @mention.
Between alerts the run only edits the issue's numbers, which sends no email.
The issue's body records which alerts fired (a hidden comment at the end), and the first run of a new month closes it.

GitHub emails the owner about an issue assigned to him, and about @mentions, as long as Settings > Notifications > "Participating, @mentions and custom" has Email ticked (the default).
The workflow acts as github-actions[bot], so these are not his own actions, which GitHub would not notify him about.

This repo is public, so the issue and the run summaries show the private repos' names and minutes (nothing else about them).

## The token (owner, once a year)

The workflow's own token can't read billing, so it uses a fine-grained personal access token with one permission.

1. Open https://github.com/settings/personal-access-tokens/new.
2. Name: `n8builds-web actions usage`. Resource owner: n8watkins. Expiration: 1 year (custom date).
3. Repository access: "Public repositories" (it needs no repo access).
4. Account permissions: **Plan: Read-only**. Nothing else.
5. Generate the token and copy it.
6. In Claude Code, run `! gh secret set ACTIONS_USAGE_TOKEN -R n8watkins/n8builds-web` and paste it at the hidden prompt.
   Never paste it into the chat.
7. Run the workflow once: `gh workflow run actions-usage.yml -R n8watkins/n8builds-web`.

Until the secret exists, each run skips with a notice and stays green.
When the token expires or loses the permission, the run fails red with a message saying so, and GitHub emails the owner about the failed run.
