'use client'

import { useEffect } from 'react'

export function ReadReceiptTracker({ announcementIds }: { announcementIds: string[] }) {
  useEffect(() => {
    // Fire-and-forget: mark all visible announcements as read
    announcementIds.forEach(id => {
      fetch('/api/announcements/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementId: id }),
      }).catch(() => {})
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
