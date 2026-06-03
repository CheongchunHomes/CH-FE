import { get, post } from "@/lib/api"

export type AlarmNotification = {
  alarmNotificationId: number
  userId: number
  description: string
  checked: boolean
  createdAt: string
  updatedAt: string | null
}

export async function getUnreadAlarmNotifications() {
  return get<AlarmNotification[]>("/api/alarm-notifications/unread", {
    cache: "no-store",
    suppressGlobalError: true,
  })
}

export async function markAlarmNotificationAsRead(alarmNotificationId: number) {
  return post<void>(`/api/alarm-notifications/${alarmNotificationId}/read`, undefined, {
    suppressGlobalError: true,
  })
}
