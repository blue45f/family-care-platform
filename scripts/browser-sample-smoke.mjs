#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

const API_URL = process.env.FAMILY_CARE_API_URL ?? 'http://127.0.0.1:3001/api';
const APP_URL = process.env.FAMILY_CARE_APP_URL;
const SCENARIO_PATH = new URL('./sample-scenario.json', import.meta.url);
const APP_DEFAULT_CANDIDATES = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5178',
  'http://127.0.0.1:5178',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

async function requestText(url, init = {}) {
  const response = await fetch(url, {
    headers: {
      'content-type': 'application/json',
      ...init.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const raw = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${raw}`);
  }

  return response.text();
}

async function requestJson(path, init = {}) {
  const raw = await requestText(path, init);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON response from ${path}: ${(error instanceof Error ? error.message : String(error))}`);
  }
}

async function requestHtml(url, init = {}) {
  const response = await fetch(url, {
    ...init,
  });

  if (!response.ok) {
    const raw = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${raw}`);
  }

  return response.text();
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalize(v) {
  return `${v}`.trim();
}

async function resolveAppUrl() {
  if (APP_URL) {
    const html = await requestHtml(APP_URL);
    return { url: APP_URL, html };
  }

  for (const url of APP_DEFAULT_CANDIDATES) {
    try {
      const html = await requestHtml(url);
      if (!html.includes('<title>가족 돌봄 운영 플랫폼') && !html.includes('family care platform')) {
        throw new Error('다른 Vite 앱으로 판단');
      }
      return { url, html };
    } catch {
      // 다음 후보로 진행
    }
  }

  throw new Error('브라우저 샘플에서 접근 가능한 앱 URL을 찾지 못했습니다. 웹앱이 실행 중인지 확인하세요.');
}

async function main() {
  const scenarioRaw = await readFile(SCENARIO_PATH, 'utf8');
  const scenario = JSON.parse(scenarioRaw);

  const marker = `SMOKE-${Date.now()}`;

  const { url: usedAppUrl, html: appResponse } = await resolveAppUrl();
  console.log(`[OK] 앱 페이지 응답 확인 (${usedAppUrl})`);
  assert(appResponse.includes('<!doctype html>') || appResponse.includes('<html'), '앱 루트 페이지 응답이 HTML이 아닙니다.');

  const initialOverview = await requestJson(`${API_URL}/admin/overview`);
  assert(typeof initialOverview.activeHouseholds === 'number', '관리자 overview 응답 스키마가 올바르지 않습니다.');

  const createdCareLogs = [];
  for (const careLog of scenario.careLogs) {
    const payload = { ...careLog, recipient: `${careLog.recipient} ${marker}` };
    const created = await requestJson(`${API_URL}/care-logs`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    assert(created.recipient === payload.recipient, '돌봄 기록이 정상 등록되지 않았습니다.');
    createdCareLogs.push(created);
  }

  const createdSettlements = [];
  for (const settlement of scenario.settlements) {
    const payload = { ...settlement, recipient: `${settlement.recipient} ${marker}` };
    const created = await requestJson(`${API_URL}/settlements`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    assert(created.totalAmount === created.careHours * created.baseRate, '정산 총액이 계산값과 일치하지 않습니다.');
    assert(created.recipient === payload.recipient, '정산 항목이 정상 등록되지 않았습니다.');
    createdSettlements.push(created);
  }

  const createdClaims = [];
  for (const claim of scenario.claims) {
    const payload = {
      ...claim,
      recipient: `${claim.recipient} ${marker}`,
      note: `${claim.note} (${marker})`,
    };
    const created = await requestJson(`${API_URL}/claims`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    assert(created.status === claim.status, '보험청구 상태 값이 저장 시점과 다릅니다.');
    assert(created.recipient === payload.recipient, '보험청구가 정상 등록되지 않았습니다.');
    createdClaims.push(created);
  }

  const careLogs = await requestJson(`${API_URL}/care-logs`);
  for (const created of createdCareLogs) {
    assert(careLogs.some((item) => item.recipient === created.recipient), `돌봄 기록 누락: ${created.recipient}`);
  }

  const settlements = await requestJson(`${API_URL}/settlements`);
  for (const created of createdSettlements) {
    assert(settlements.some((item) => item.id === created.id && item.totalAmount === created.totalAmount), `정산 누락 또는 수치 불일치: ${created.id}`);
  }

  const claims = await requestJson(`${API_URL}/claims`);
  for (const created of createdClaims) {
    assert(claims.some((item) => item.id === created.id && item.status === created.status), `보험청구 누락: ${created.id}`);
  }

  const targetClaim = claims.find((item) => item.recipient.startsWith(`${scenario.claimTargetRecipient} ${marker}`));
  assert(targetClaim, '테스트 청구 대상 건을 찾을 수 없습니다.');

  const updatedClaim = await requestJson(`${API_URL}/claims/${targetClaim.id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: scenario.claimStatusTransition }),
  });
  assert(updatedClaim.status === scenario.claimStatusTransition, '보험청구 상태 전환 결과가 예상과 다릅니다.');

  const plans = await requestJson(`${API_URL}/admin/plans`);
  assert(Array.isArray(plans) && plans.length > 0, '요금제 조회 결과가 비어 있습니다.');

  const overview = await requestJson(`${API_URL}/admin/overview`);
  assert(overview.totalClaims >= initialOverview.totalClaims + createdClaims.length, '청구 건수가 기대값 대비 적지 않습니다.');
  assert(overview.approvedClaims >= 1, '승인 청구가 반영되지 않았습니다.');
  assert(overview.monthlyTrend && Array.isArray(overview.monthlyTrend), '월별 추세 데이터가 없습니다.');

  // 문자열 기반 단순 검증(공백/특수문자 영향 제거)
  const firstTrend = normalize(`${overview.monthlyTrend?.[0]?.month ?? ''}`);
  assert(firstTrend.includes('-'), '월별 추세의 월 형식이 기대하지 않습니다.');

  const updatedClaims = await requestJson(`${API_URL}/claims`);
  const verifiedApproved = updatedClaims.some(
    (claim) => claim.id === targetClaim.id && claim.status === scenario.claimStatusTransition,
  );
  assert(verifiedApproved, '최종 조회 기준에서 청구 상태가 반영되지 않습니다.');

  console.log('✅ 브라우저 샘플 시나리오 E2E 스모크 통과');
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 브라우저 샘플 시나리오 테스트 실패', error instanceof Error ? error.message : error);
    process.exit(1);
  });
