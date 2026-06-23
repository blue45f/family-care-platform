import { PostDetailPage } from './pages/PostDetailPage.tsx'
import { PostListPage } from './pages/PostListPage.tsx'
import { useHashPath } from './router'
import IntroSplashScreen from './components/IntroSplashScreen.tsx'

export function App() {
  const path = useHashPath()
  const m = path.match(/^\/post\/(.+)$/)
  const content = m ? <PostDetailPage id={decodeURIComponent(m[1])} /> : <PostListPage />

  return (
    <>
      <IntroSplashScreen />
      {content}
    </>
  )
}
