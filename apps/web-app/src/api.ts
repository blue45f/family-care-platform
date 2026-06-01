import type {
  AdminOverview,
  CareLog,
  CareLogDraft,
  Claim,
  ClaimDraft,
  ClaimStatus,
  RevenuePlan,
  RevenuePlanDraft,
  Settlement,
  SettlementDraft,
} from './types';

const DEFAULT_API_URL = import.meta.env.DEV ? 'http://127.0.0.1:3001/api' : '/api';
const BASE_URL = import.meta.env.VITE_API_URL ?? DEFAULT_API_URL;

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${input}`, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `요청이 실패했습니다. 상태: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const fetchCareLogs = () => request<CareLog[]>('/care-logs');
export const postCareLog = (body: CareLogDraft) => request<CareLog>('/care-logs', { method: 'POST', body: JSON.stringify(body) });

export const fetchSettlements = () => request<Settlement[]>('/settlements');
export const postSettlement = (body: SettlementDraft) =>
  request<Settlement>('/settlements', { method: 'POST', body: JSON.stringify(body) });

export const fetchClaims = () => request<Claim[]>('/claims');
export const postClaim = (body: ClaimDraft) => request<Claim>('/claims', { method: 'POST', body: JSON.stringify(body) });
export const patchClaimStatus = (claimId: number, status: ClaimStatus) =>
  request<Claim>(`/claims/${claimId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

export const fetchAdminOverview = () => request<AdminOverview>('/admin/overview');
export const fetchAdminPlans = () => request<RevenuePlan[]>('/admin/plans');
export const updateAdminPlan = (body: RevenuePlanDraft) =>
  request<RevenuePlan>('/admin/plans', { method: 'PATCH', body: JSON.stringify(body) });
