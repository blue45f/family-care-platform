import { defineConfig } from '@apps-in-toss/web-framework/config'

export default defineConfig({
  appName: 'family-care',
  brand: {
    primaryColor: '#4FB6A8',
  },
  permissions: [
    { name: 'clipboard', access: 'read' },
    { name: 'clipboard', access: 'write' },
  ],
  webView: {},
  webBundleDir: 'dist',
  navigationBar: { withBackButton: true, withHomeButton: true },
})
