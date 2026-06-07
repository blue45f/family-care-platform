import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { Icon, type IconName } from './Icon'

const iconNames: IconName[] = [
  'home',
  'schedule',
  'care',
  'settlement',
  'claims',
  'analytics',
  'plans',
  'guide',
  'menu',
  'close',
  'arrow-right',
  'plus',
  'refresh',
  'check',
  'clock',
  'inbox',
  'heart',
  'logout',
]

describe('Icon', () => {
  it('모든 아이콘이 선명한 currentColor SVG로 렌더링된다', () => {
    for (const name of iconNames) {
      const markup = renderToStaticMarkup(createElement(Icon, { name }))

      expect(markup).toContain('stroke="currentColor"')
      expect(markup).toContain('vector-effect="non-scaling-stroke"')
      expect(markup).toContain('focusable="false"')
      expect(markup).toContain('aria-hidden="true"')
    }
  })
})
