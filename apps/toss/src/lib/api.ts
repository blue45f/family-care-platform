import data from '../sample-data.json'

// 카테고리 enum은 packages/shared(본 서비스와 동일 소스) 재사용.
import type { CommunityCategory } from '@shared/community'

export interface Post {
  id: string
  category: CommunityCategory | string
  title: string
  body: string
  authorName: string
  comments: { author: string; body: string }[]
}
const items: Post[] = (data as { items?: Post[] }).items || []
export function getPosts(): Post[] {
  return items
}
export function getPost(id: string): Post | undefined {
  return items.find((p) => p.id === id)
}
