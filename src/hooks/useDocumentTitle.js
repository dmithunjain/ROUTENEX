import { useEffect } from 'react'

import { APP } from '@/constants/app'

/** Keep the browser tab title in sync with the current screen. */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${APP.name}` : `${APP.name} · ${APP.tagline}`
  }, [title])
}
