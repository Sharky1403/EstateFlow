import webpush from 'web-push'

const vapidPublicKey  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!
const vapidEmail      = process.env.VAPID_EMAIL ?? 'mailto:admin@estateflow.app'

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey)
}

export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body: string; url?: string }
) {
  if (!vapidPublicKey || !vapidPrivateKey) return

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload)
    )
  } catch (err: any) {
    // 410 Gone = subscription expired, safe to ignore
    if (err.statusCode !== 410) console.error('Push failed:', err.message)
  }
}
