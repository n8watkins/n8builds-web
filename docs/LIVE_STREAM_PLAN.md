# Plan: live streams on n8builds.dev (Twitch and YouTube)

Written 2026-10-23.
Status: planned; build it about a week before the first stream, so it can be tested against a real live session.

## What visitors get

- **When you're live on Twitch, YouTube or both:**
  - A floating mini-player in a corner of every page (bottom-right by default), playing muted, with a "Live" label.
  - Controls: unmute, expand to a larger view, minimize to a small "Live" pill, move to another corner, close, and "Watch on Twitch / YouTube".
  - If you're live on both, two tabs in the player switch between them.
  - The navbar's Twitch link (and YouTube, once it's back) gets a pulsing "Live" dot.
- **When you're offline:** nothing at all; no empty player, no "offline" box.
- **Remembering choices:** corner, minimized and closed are remembered per visitor (closing keeps it closed for that stream, not forever).
- **Phones:** the player starts as the minimized pill at the bottom so it never covers the page; tapping it opens a full-width player.
- **Reduced motion:** no pulsing or sliding; the player just appears.

## How it works (all free)

| Piece | How | Cost |
|---|---|---|
| Twitch player | Twitch's official embed (`player.twitch.tv`, with `parent=n8builds.dev`) | Free |
| Twitch live check | Twitch Helix API `GET /streams?user_login=n8watkins`, with an app token from a free Twitch developer app | Free |
| YouTube player | YouTube's embed for the channel's current live stream (`/embed/live_stream?channel=<channel id>`) | Free |
| YouTube live check | YouTube Data API `liveBroadcasts.list` for your own channel, authorized once with your Google sign-in | 1 unit per check; the free quota is 10,000 a day |
| Server | One small API route on the site (`/api/live`) that checks both and caches the answer for 60 seconds, so visitors never hit Twitch or YouTube directly | Within Vercel's free tier |

Notes:
- The cheaper-looking YouTube option, `search.list` with an API key, costs 100 units per check, which would allow only about one check every 15 minutes. `liveBroadcasts.list` costs 1 unit but needs a one-time sign-in to your channel, which is why it's in the "from you" list.
- Browsers only allow autoplay when muted, so the player starts muted.
- The site's security policy (CSP) gets `player.twitch.tv`, `www.youtube.com` and `www.youtube-nocookie.com` as allowed frames; nothing else changes.
- Tests run against fake live and offline answers, so they don't need you to be streaming.

## What I need from you

1. **Twitch developer app** (2 minutes): dev.twitch.tv, Your Console, Register Your Application.
   Name `n8builds.dev`, OAuth redirect `http://localhost`, category Website Integration, client type Confidential.
   Then add the Client ID and a new Client Secret to Vercel as `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` (Production and Preview), the same way as the GitHub token.
2. **Your YouTube channel:** the handle or channel URL you'll stream from (YouTube needs a channel with live streaming enabled; enabling it can take up to 24 hours the first time).
3. **YouTube API access** (10 minutes, guided): a Google Cloud project with the YouTube Data API enabled, an OAuth client, and one sign-in to authorize read-only access to your channel.
   I'll walk you through it and store the result in Vercel as `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET` and `YOUTUBE_REFRESH_TOKEN`.
4. **Choices** (defaults in brackets): the default corner [bottom-right], and whether the player shows on every page or only the homepage [every page].

## Build steps

1. `/api/live`: the Twitch and YouTube checks, the 60-second cache, a test mode with fake answers.
2. The floating player component, its controls and remembered choices, the phone layout.
3. Navbar live dots; YouTube link back in the navbar and `sameAs`.
4. CSP update, E2E tests (live on one, both, neither; phone; reduced motion; keyboard), Lighthouse.
5. A test with a real, unlisted live stream on each platform before the first public stream.
