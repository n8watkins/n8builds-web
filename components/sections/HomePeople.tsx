import { LuUsers } from 'react-icons/lu'
import SectionMark from '@/components/ui/SectionMark'
import { PeopleGrid, PrPostCard } from '@/components/sections/LoadoutDevTools'

/**
 * People I follow (moved here from /loadout on 2026-11-01): who each of them
 * is and what they work on in public, then The Pull Request Post, the paper
 * pr-post prints from their public GitHub activity, right under them. The
 * tools on /loadout credit their makers with a link to these cards.
 */
export default function HomePeople() {
  return (
    <section id="people" aria-labelledby="people-title" className="scroll-mt-20 py-16">
      <SectionMark id="people-title" icon={<LuUsers aria-hidden="true" />} title="People I follow">
        What each of them is working on in public.
      </SectionMark>
      <PeopleGrid />
      <div className="mt-5">
        <PrPostCard />
      </div>
    </section>
  )
}
