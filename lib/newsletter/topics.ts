import { UPCOMING, type UpcomingSlug } from '@/data/upcoming'

/**
 * The Kit tags the site applies (docs/DECISIONS.md "The newsletter runs on
 * Kit"). Kit matches them by exact name, and the site creates any that are
 * missing, so renaming one here starts a new tag in Kit: rename it in Kit too.
 *
 * - A topic is what a reader picks on the newsletter form.
 * - A waitlist tag marks the people waiting for one upcoming project.
 */

export const TOPICS = [
  { id: 'everything', label: 'Everything', hint: 'Posts, launches and news', tag: 'Everything' },
  { id: 'notions', label: 'n8 Notions', hint: 'A new post on the blog', tag: 'n8 Notions posts' },
  { id: 'launches', label: 'New launches', hint: 'When a project opens or ships', tag: 'New launches' },
] as const

export type TopicId = (typeof TOPICS)[number]['id']

export const TOPIC_IDS = TOPICS.map((t) => t.id) as [TopicId, ...TopicId[]]

export function topicTags(ids: readonly TopicId[]): string[] {
  return TOPICS.filter((t) => ids.includes(t.id)).map((t) => t.tag)
}

/** The tag for one project's waitlist, by the project's name: "Waitlist: Feelium". */
export function waitlistTag(slug: UpcomingSlug): string {
  const project = UPCOMING.find((p) => p.slug === slug)
  return `Waitlist: ${project?.name ?? slug}`
}
