# Plan: live streams on n8builds.dev (Twitch and YouTube)

Written 2026-10-23, revised 2026-10-24.
Status: planned; build it about a week before the first stream, so it can be tested against a real live session.

## Recommendation in one paragraph

Show a floating corner player on every page whenever you're live on Twitch, YouTube or both, with a "Watch on Twitch / YouTube" button that opens the real stream, where chat, follows and subscriptions happen.
Add one share link, **n8builds.dev/live**, that sends people to wherever you're live right now.
Detect "live" on the server once a minute with each platform's free official API (Twitch: a free developer app; YouTube: a free API key, no Google sign-in needed), and load the player only when you're actually live, so the site stays fast the rest of the time.
Leave chat on the platforms for now; an embedded chat can come later if people ask for it.

## What visitors get

**While you're live (on either platform, or both):**

- A floating mini-player in a corner of every page (bottom-right by default), playing muted, with a "Live" label and the stream title.
- Controls: unmute, expand to a larger view, move to another corner, minimize to a small "Live" pill, close.
- **"Watch on Twitch" / "Watch on YouTube"** buttons that open the stream on the real platform in a new tab (to chat, follow, subscribe, or watch in the app).
- If you're live on both, two tabs in the player switch between them; Twitch is shown first unless you choose otherwise.
- The navbar's Twitch and YouTube links get a pulsing "Live" dot and point straight at the live stream.
- The corner, minimized and closed choices are remembered per visitor; closing hides it for that stream, not forever.
- Phones: it starts as the minimized pill at the bottom, so it never covers the page; tapping opens a full-width player.
- Reduced motion: no pulsing or sliding.

**While you're offline:** no player and no empty box; the navbar links go to your channel pages as usual.

**n8builds.dev/live (one link to share anywhere):**

- Live on Twitch: redirects to twitch.tv/n8watkins.
- Live on YouTube only: redirects to your YouTube live stream.
- Live on both: goes to your preferred platform (Twitch by default).
- Offline: a small page with your channels, the next scheduled stream if YouTube has one, and the latest builds.

## How it works (all free)

| Piece | How | Cost |
|---|---|---|
| Twitch player | Twitch's official embed (`player.twitch.tv`, `parent=n8builds.dev`) | Free |
| Twitch live check | Twitch Helix API, `GET /streams?user_login=n8watkins`, with a token from a free Twitch developer app | Free (limit 800 requests a minute; we use 1) |
| YouTube player | YouTube's embed of the live video (`youtube-nocookie.com/embed/<video id>`) | Free |
| YouTube live check | YouTube Data API with an API key: list the channel's newest uploads (`playlistItems.list`, 1 unit), then check whether one is live (`videos.list`, 1 unit) | 2 units a check; once a minute is about 2,900 of the 10,000 free daily units |
| `/api/live` | One route on the site asks both platforms and caches the answer for 60 seconds, so visitors never call Twitch or YouTube directly | Within Vercel's free tier |

The player's code and the platform iframes load only when `/api/live` says you're live, so offline page loads cost nothing extra.

## Limitations, and how the plan handles each

| Limitation | Effect | Handling |
|---|---|---|
| Browsers only autoplay muted video | The player starts silent | A clear "Unmute" button; that's normal for embedded streams |
| Detection is polled | The player appears up to about a minute after you go live, and lingers up to a minute after you stop | 60-second cache; good enough for streams that last hours |
| YouTube can lag in listing a new live stream | The YouTube side may take a few extra minutes to appear | Accept it; Twitch shows immediately, and /live falls back to your channel's live page |
| A YouTube stream must allow embedding | If embedding is off, or the stream is age-restricted or "made for kids", YouTube refuses to play it on other sites | Keep embedding on in YouTube Studio; if the embed fails, the player shows a "Watch on YouTube" card instead |
| Twitch embeds only work on listed domains | Preview deployments (`*.vercel.app`) won't play Twitch | Production and localhost are listed; previews show the "Watch on Twitch" card |
| Chat, follows, subs and Super Chats happen on the platforms | The site's player is watch-only | The "Watch on" buttons; an embedded chat is a later option (see below) |
| Ads and viewer counts | Platform ads can play in embeds; embedded viewers count toward your viewer numbers on both platforms | Nothing to do |
| Third-party cookies and privacy | The Twitch and YouTube players set their own cookies | YouTube uses the no-cookie domain; the privacy page gets a short "live streams" paragraph |
| Performance while live | The players are heavy (about 1-2 MB) | Loaded only while live, and only after the page itself has finished loading |
| iPhone fullscreen | Expanding the YouTube player on iOS opens the native fullscreen player | Expected iOS behavior |
| API keys can be abused if exposed | Someone could burn your YouTube quota | Keys stay server-side in Vercel and are restricted to the YouTube Data API; the 60-second cache caps usage |

## Options considered and not recommended (for now)

- **YouTube detection with a Google sign-in (`liveBroadcasts.list`):** 1 unit a check, but it needs an OAuth app, and in Google's "testing" mode its refresh token expires every 7 days. The API-key method above avoids all of that for 1 extra unit.
- **YouTube push notifications (WebSub):** near-instant, but it needs a public callback, a subscription that renews every few days, and storage; worth it only if the minute of delay ever matters.
- **Embedded chat:** possible on both platforms (Twitch chat embed; YouTube `live_chat` embed with the site's domain), but it doubles the page weight, and viewers must log in to the platform to post anyway. Revisit once streams have regular chatters.
- **Multistreaming tools (Restream and similar):** a separate decision about how you broadcast; this plan works whether you stream to one platform or both at once.

## What I need from you

1. **Twitch developer app** (about 2 minutes): dev.twitch.tv, Your Console, Register Your Application.
   Name `n8builds.dev`, OAuth Redirect URL `http://localhost`, category Website Integration, client type Confidential.
   Then add the Client ID and a new Client Secret in Vercel as `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` (Production and Preview), or hand them to Claude to add.
2. **YouTube channel:** the channel you'll stream from (its handle or URL), with live streaming enabled in YouTube Studio (enabling it can take up to 24 hours the first time) and embedding left on for your streams.
3. **YouTube API key** (about 5 minutes): console.cloud.google.com, create a project `n8builds-live`, enable "YouTube Data API v3", Credentials, Create credentials, API key, then restrict it to the YouTube Data API v3.
   Add it in Vercel as `YOUTUBE_API_KEY`.
4. **Choices** (defaults in brackets): the default corner [bottom-right]; the preferred platform when live on both [Twitch]; player on every page or the homepage only [every page].

## Build steps (Claude)

1. `/api/live`: Twitch and YouTube checks, the 60-second cache, a test mode with fake live and offline answers.
2. The floating player: tabs, controls, remembered choices, the phone pill, the "Watch on" buttons, the fallback card when an embed can't play.
3. `/live` redirect page; navbar live dots; the YouTube link back in the navbar and `sameAs`.
4. CSP (allow the two players as frames), privacy page paragraph.
5. Tests: live on Twitch, on YouTube, on both, on neither; embed refused; phone; keyboard; reduced motion; Lighthouse on an offline page load stays unchanged.
6. With you: a real test stream on each platform before the first public stream.
   An API key only sees public videos, so for an unlisted YouTube test, `/api/live` accepts a temporary `LIVE_YOUTUBE_VIDEO_ID` override in Vercel; Twitch tests work as they are.

Estimated effort: one working session once the credentials are in.
