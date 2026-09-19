/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.xlsx?url' {
  const src: string;
  export default src;
}

declare module '*.xlsx' {
  const src: string;
  export default src;
}
