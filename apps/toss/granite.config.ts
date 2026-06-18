import { defineConfig } from '@apps-in-toss/web-framework/config'

// 가족 돌봄 정보 커뮤니티(비민감 가이드/후기). 비게임=partner. 운영 개인정보는 제외.
export default defineConfig({
  appName: 'family-care',
  brand: { displayName: '패밀리케어', primaryColor: '#4FB6A8', icon: '' },
  web: { host: 'localhost', port: 5189, commands: { dev: 'vite', build: 'vite build' } },
  permissions: [
    { name: 'clipboard', access: 'read' },
    { name: 'clipboard', access: 'write' },
  ],
  outdir: 'dist',
  webViewProps: { type: 'partner' },
  navigationBar: { withBackButton: true, withHomeButton: true },
})
