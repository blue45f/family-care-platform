import { scheduleStatuses } from '@family-care/shared'
import { z } from 'zod'

import type { CareScheduleInput } from './schedule.model'

export { scheduleStatuses }

const requiredText = (message: string) =>
  z
    .string({ error: message })
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, { message })

const REQUIRED_FIELDS_MESSAGE = 'recipient/caregiver/date/startTime/endTime는 필수입니다.'
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/

export const scheduleInputSchema = z
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
    note: z.string({ error: '메모는 문자열이어야 합니다.' }).transform((value) => value.trim()),
  })
  .refine((value) => value.endTime > value.startTime, {
    path: ['endTime'],
    message: '종료 시간은 시작 시간보다 늦어야 합니다.',
  }) satisfies z.ZodType<CareScheduleInput>

export const scheduleStatusSchema = z.object({
  status: z.enum(scheduleStatuses, { error: '유효하지 않은 일정 상태입니다.' }),
})

export type ScheduleInputParsed = z.infer<typeof scheduleInputSchema>
export type ScheduleStatusParsed = z.infer<typeof scheduleStatusSchema>
