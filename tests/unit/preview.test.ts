import { describe, expect, it } from 'vitest'
import { safePreviewPath } from '@/lib/preview'

describe('safePreviewPath', () => {
  it('keeps site paths, with their query', () => {
    expect(safePreviewPath('/blog/hello')).toBe('/blog/hello')
    expect(safePreviewPath('/blog?topic=ai')).toBe('/blog?topic=ai')
  })

  it('sends anything that could leave the site to /blog', () => {
    for (const path of ['//evil.example', '/\\evil.example', 'https://evil.example/', 'evil', '', null, undefined]) {
      expect(safePreviewPath(path)).toBe('/blog')
    }
  })
})
