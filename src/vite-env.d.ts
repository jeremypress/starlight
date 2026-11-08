/// <reference types="vite/client" />

interface Window {
  /** `true` when running inside the Starlight iOS app (injected by the native shell). */
  starlightNative?: boolean
}
