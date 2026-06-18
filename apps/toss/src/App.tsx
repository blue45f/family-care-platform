import { PostDetailPage } from './pages/PostDetailPage.tsx'
import { PostListPage } from './pages/PostListPage.tsx'
import { useHashPath } from './router'

export function App() {
  const path = useHashPath()
  const m = path.match(/^\/post\/(.+)$/)
  if (m) return <PostDetailPage id={decodeURIComponent(m[1])} />
  return <PostListPage />
}
