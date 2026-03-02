/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL for the API (e.g. "https://ntpc-garbage-tracker-api.vercel.app") */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
