import AnalyticsService from '../modules/AnalyticsService'
import Sounds from '../modules/Sounds'

export const CHECK_OUT_PRO = 'CHECK_OUT_PRO'
export const TOGGLE_TICK_SOUND = 'TOGGLE_TICK_SOUND'
export const TOGGLE_RING_SOUND = 'TOGGLE_RING_SOUND'
export const NOTIFICATION_PERMISSION_GRANT = 'NOTIFICATION_PERMISSION_GRANT'

export function toggleTickSound () {
  AnalyticsService.track('toggle-tick-sound')
  Sounds.toggleTickSound()
  return { type: TOGGLE_TICK_SOUND, payload: {} }
}

export function toggleRingSound () {
  AnalyticsService.track('toggle-ring-sound')
  Sounds.toggleRingSound()
  return { type: TOGGLE_RING_SOUND, payload: {} }
}
export function checkOutPro () {
  AnalyticsService.track('check-out-pro')
  // Sounds.toggleRingSound()
  console.log('checkOutPro')
  return { type: CHECK_OUT_PRO, payload: {} }
}

export function grantNotificationPermission ({ grant }) {
  AnalyticsService.track('grant-notification-permission', { grant })
  return { type: NOTIFICATION_PERMISSION_GRANT, payload: { grant } }
}
