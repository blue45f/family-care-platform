import { scheduleStatuses } from '@family-care/shared'
import { z } from 'zod'

export { scheduleStatuses }

const requiredText = (message: string) =>
  z.string({ error: message }).refine((value) => value.trim().length > 0, { message })

const REQUIRED_FIELDS_MESSAGE = '대상자, 담당자, 날짜, 시작/종료 시간은 필수입니다.'
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/

export const scheduleFormSchema = z
  .object({
    recipient: requiredText(REQUIRED_FIELDS_MESSAGE),
    caregiver: requiredText(REQUIRED_FIELDS_MESSAGE),
    date: requiredText(REQUIRED_FIELDS_MESSAGE),
    startTime: requiredText(REQUIRED_FIELDS_MESSAGE).refine((value) => timePattern.test(value), {
      message: '시간은 HH:mm 형식이어야 합니다.',
    }),
    endTime: requiredText(REQUIRED_FIELDS_MESSAGE).refine((value) => timePattern.test(value), {
      message: '시간은 HH:mm 형식이어야 합니다.',
    }),
    status: z.enum(scheduleStatuses, { error: '유효하지 않은 일정 상태입니다.' }),
    note: z.string(),
  })
  .refine((value) => value.endTime > value.startTime, {
    path: ['endTime'],
    message: '종료 시간은 시작 시간보다 늦어야 합니다.',
  })

export type ScheduleFormValues = z.infer<typeof scheduleFormSchema>
