import type {
  AdminOverview,
  CareLog,
  CareLogDraft,
  CareSchedule,
  CareScheduleDraft,
  Claim,
  ClaimDraft,
  ClaimStatus,
  ScheduleStatus,
  RevenuePlan,
  RevenuePlanDraft,
  Settlement,
  SettlementDraft,
} from './types'
import { authHeader } from './auth/useAuth'

const DEFAULT_API_URL = import.meta.env.DEV ? 'http://127.0.0.1:3001/api' : '/api'
const BASE_URL = import.meta.env.VITE_API_URL ?? DEFAULT_API_URL
const NETWORK_RETRY_COUNT = 2
const NETWORK_RETRY_DELAY_MS = 240

const wait = (delayMs: number) => new Promise((resolve) => setTimeout(resolve, delayMs))

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  let response: Response | null = null

  for (let attempt = 0; attempt <= NETWORK_RETRY_COUNT; attempt += 1) {
    try {
      response = await fetch(`${BASE_URL}${input}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
          ...init?.headers,
        },
      })
      break
    } catch (error) {
      if (attempt >= NETWORK_RETRY_COUNT) {
        throw error
      }
      await wait(NETWORK_RETRY_DELAY_MS * (attempt + 1))
    }
  }

  if (!response) {
    throw new Error('API 요청 응답을 받지 못했습니다.')
  }

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `요청이 실패했습니다. 상태: ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export const fetchCareLogs = () => request<CareLog[]>('/care-logs')
export const postCareLog = (body: CareLogDraft) =>
  request<CareLog>('/care-logs', {
    method: 'POST',
    body: JSON.stringify(body),
  })

export const fetchSchedules = () => request<CareSchedule[]>('/schedules')
export const postSchedule = (body: CareScheduleDraft) =>
  request<CareSchedule>('/schedules', {
    method: 'POST',
    body: JSON.stringify(body),
  })
export const patchScheduleStatus = (scheduleId: number, status: ScheduleStatus) =>
  request<CareSchedule>(`/schedules/${scheduleId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })

export const fetchSettlements = () => request<Settlement[]>('/settlements')
export const postSettlement = (body: SettlementDraft) =>
  request<Settlement>('/settlements', {
    method: 'POST',
    body: JSON.stringify(body),
  })

export const fetchClaims = () => request<Claim[]>('/claims')
export const postClaim = (body: ClaimDraft) =>
  request<Claim>('/claims', { method: 'POST', body: JSON.stringify(body) })
export const patchClaimStatus = (claimId: number, status: ClaimStatus) =>
  request<Claim>(`/claims/${claimId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })

export const fetchAdminOverview = () => request<AdminOverview>('/admin/overview')
export const fetchAdminPlans = () => request<RevenuePlan[]>('/admin/plans')
export const updateAdminPlan = (body: RevenuePlanDraft) =>
  request<RevenuePlan>('/admin/plans', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
