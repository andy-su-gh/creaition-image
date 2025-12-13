/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_AI_API_KEY: string
  readonly VITE_MAX_HISTORY_ITEMS: string
  // Tencent Hunyuan API credentials
  readonly VITE_TENCENT_SECRET_ID: string
  readonly VITE_TENCENT_SECRET_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}