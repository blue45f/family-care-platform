export const scheduleStatuses = ['예정', '진행중', '완료', '취소'] as const

export type ScheduleStatus = (typeof scheduleStatuses)[number]

export type CareSchedule = {
  id: number
  recipient: string
  caregiver: string
  date: string
  startTime: string
  endTime: string
  status: ScheduleStatus
  note: string
}

export type CareScheduleInput = Omit<CareSchedule, 'id'>
