import { type FormEvent, type ReactNode } from "react";

import { claimStatusClass, formatRate, formatWon } from "../../utils";
import {
  careLogTypeOptions,
  claimStatusOptions,
  type CareLogDraftState,
  type PlatformData,
} from "../../state/usePlatformData";
import {
  operationsModuleMeta,
  operationsModuleRoute,
  type RouteCompositionMeta,
} from "../../routeConfig";
import type {
  OperationsRouteModule,
  NonHomeRoutePath,
} from "../../routeConfig";
import { RouteField } from "../common/RouteField";

type OperationsPageProps = {
  modules: readonly OperationsRouteModule[];
  compositionMeta: RouteCompositionMeta;
  data: PlatformData;
  onNavigate: (path: NonHomeRoutePath) => void;
  activeRoutePath: NonHomeRoutePath;
};

type CareLogPayload = {
  recipient: string;
  caregiver: string;
  type: CareLogDraftState["type"];
  date: string;
  note: string;
};

type ClaimPayload = {
  recipient: string;
  hospitalName: string;
  expectedAmount: number;
  issueDate: string;
  status: (typeof claimStatusOptions)[number];
  note: string;
};

const renderOverview = ({
  activeHouseholds,
  pendingClaims,
  totalSettlement,
  approvalRate,
  claims,
  totalClaimExpected,
}: {
  activeHouseholds: number;
  pendingClaims: number;
  totalSettlement: number;
  approvalRate: number;
  claims: PlatformData["claims"];
  totalClaimExpected: number;
}): ReactNode => {
  return (
    <section className="panel panel-ops panel-overview">
      <div className="panel-head">
        <div className="panel-title-wrap">
          <span className="panel-chip">운영 개요</span>
          <h2>오늘 바로 처리해야 할 운영 상황</h2>
        </div>
        <p className="subtle">
          보호자 운영의 핵심 수치와 다음 액션 우선순위를 한 화면에서 점검합니다.
        </p>
      </div>

      <div className="kpi-ribbons">
        <article className="kpi-ribbon">
          <p>활성 가구</p>
          <strong>{activeHouseholds}개</strong>
        </article>
        <article className="kpi-ribbon">
          <p>미승인 청구</p>
          <strong>{pendingClaims}건</strong>
        </article>
        <article className="kpi-ribbon">
          <p>월간 정산</p>
          <strong>{formatWon(totalSettlement)}</strong>
        </article>
        <article className="kpi-ribbon">
          <p>실시간 승인률</p>
          <strong>{formatRate(approvalRate)}</strong>
        </article>
      </div>

      <div className="kpi-table-wrap">
        <table className="kpi-table">
          <caption className="sr-only">운영 핵심 상태</caption>
          <thead>
            <tr>
              <th scope="col">항목</th>
              <th scope="col">현재 수치</th>
              <th scope="col">바로 조치</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">총 케어 기록 건수</th>
              <td>
                <strong>{claims.length}건</strong>
              </td>
              <td>돌봄 등록 또는 청구 등록</td>
            </tr>
            <tr>
              <th scope="row">청구 미처리 건수</th>
              <td>
                <strong>{pendingClaims}건</strong>
              </td>
              <td>청구 상태 변경</td>
            </tr>
            <tr>
              <th scope="row">청구 합계액</th>
              <td>
                <strong>{formatWon(totalClaimExpected)}</strong>
              </td>
              <td>정산/승인 상태 검토</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
};

const renderCareForm = (
  module: "care",
  data: PlatformData,
  onSubmitStatus: (event: FormEvent<HTMLFormElement>) => void,
): ReactNode => {
  const moduleMeta = operationsModuleMeta[module];
  const { careLogDraft } = data;

  return (
    <section
      key={module}
      className={`panel panel-ops ${moduleMeta.panelClass}`}
    >
      <div className="panel-head">
        <span className="panel-chip">{moduleMeta.panelChip}</span>
        <h2>{moduleMeta.panelTitle}</h2>
        <p className="subtle">{moduleMeta.panelDescription}</p>
      </div>

      <form className="row" onSubmit={onSubmitStatus}>
        <RouteField id={`care-recipient-${module}`} label="보호자명">
          <input
            id={`care-recipient-${module}`}
            type="text"
            value={careLogDraft.recipient}
            onChange={(event) =>
              data.updateCareLogField("recipient", event.target.value)
            }
            placeholder="예: 김보호자"
            required
          />
        </RouteField>

        <RouteField id={`caregiver-${module}`} label="돌봄인력">
          <input
            id={`caregiver-${module}`}
            type="text"
            value={careLogDraft.caregiver}
            onChange={(event) =>
              data.updateCareLogField("caregiver", event.target.value)
            }
            placeholder="예: 박간병인"
            required
          />
        </RouteField>

        <RouteField id={`care-type-${module}`} label="유형">
          <select
            id={`care-type-${module}`}
            value={careLogDraft.type}
            onChange={(event) =>
              data.updateCareLogField(
                "type",
                event.target.value as CareLogPayload["type"],
              )
            }
          >
            {careLogTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </RouteField>

        <RouteField id={`care-date-${module}`} label="기록일">
          <input
            id={`care-date-${module}`}
            type="date"
            value={careLogDraft.date}
            onChange={(event) =>
              data.updateCareLogField("date", event.target.value)
            }
          />
        </RouteField>

        <RouteField id={`care-note-${module}`} label="메모">
          <textarea
            id={`care-note-${module}`}
            value={careLogDraft.note}
            onChange={(event) =>
              data.updateCareLogField("note", event.target.value)
            }
            placeholder="돌봄 중 핵심 내용"
            required
            rows={3}
          />
        </RouteField>

        <button type="submit" className="btn btn-primary">
          돌봄 기록 등록
        </button>
      </form>

      {data.careLogs.length > 0 ? (
        <ul className="list" aria-label="돌봄 기록 목록">
          {data.careLogs.slice(0, 3).map((log) => (
            <li key={log.id}>
              <div className="list-title">
                <strong>{log.recipient}</strong>
                <span className="muted">{log.caregiver}</span>
              </div>
              <p>
                [{log.type}] {log.date} · {log.note}
              </p>
              <p className="subtle">최근 입력: {log.date}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty">등록된 돌봄 기록이 없습니다.</p>
      )}
    </section>
  );
};

const renderSettlementForm = (
  module: "settlement",
  data: PlatformData,
  onSubmitStatus: (event: FormEvent<HTMLFormElement>) => void,
): ReactNode => {
  const moduleMeta = operationsModuleMeta[module];
  const { settlementDraft } = data;

  return (
    <section
      key={module}
      className={`panel panel-ops ${moduleMeta.panelClass}`}
    >
      <div className="panel-head">
        <span className="panel-chip">{moduleMeta.panelChip}</span>
        <h2>{moduleMeta.panelTitle}</h2>
        <p className="subtle">{moduleMeta.panelDescription}</p>
      </div>

      <form className="row" onSubmit={onSubmitStatus}>
        <RouteField id={`settlement-recipient-${module}`} label="보호자명">
          <input
            id={`settlement-recipient-${module}`}
            type="text"
            value={settlementDraft.recipient}
            onChange={(event) =>
              data.updateSettlementField("recipient", event.target.value)
            }
            placeholder="예: 김보호자"
            required
          />
        </RouteField>

        <RouteField id={`settlement-date-${module}`} label="정산일">
          <input
            id={`settlement-date-${module}`}
            type="date"
            value={settlementDraft.date}
            onChange={(event) =>
              data.updateSettlementField("date", event.target.value)
            }
          />
        </RouteField>

        <RouteField id={`settlement-hours-${module}`} label="돌봄 시간(시간)">
          <input
            id={`settlement-hours-${module}`}
            type="number"
            value={settlementDraft.careHours}
            min={1}
            onChange={(event) =>
              data.updateSettlementField(
                "careHours",
                Number(event.target.value) || 0,
              )
            }
          />
        </RouteField>

        <RouteField id={`settlement-rate-${module}`} label="시간당 요금">
          <input
            id={`settlement-rate-${module}`}
            type="number"
            value={settlementDraft.baseRate}
            min={1}
            onChange={(event) =>
              data.updateSettlementField(
                "baseRate",
                Number(event.target.value) || 0,
              )
            }
          />
        </RouteField>

        <RouteField id={`settlement-note-${module}`} label="메모">
          <input
            id={`settlement-note-${module}`}
            value={settlementDraft.note}
            onChange={(event) =>
              data.updateSettlementField("note", event.target.value)
            }
            placeholder="추가 메모"
          />
        </RouteField>

        <button type="submit" className="btn btn-primary">
          정산 항목 생성
        </button>
      </form>

      {data.settlements.length > 0 ? (
        <ul className="list" aria-label="정산 목록">
          {data.settlements.slice(0, 3).map((settlement) => (
            <li key={settlement.id}>
              <div className="list-title">
                <strong>{settlement.recipient}</strong>
                <span>{settlement.date}</span>
              </div>
              <p>
                {settlement.careHours}h × {formatWon(settlement.baseRate)} ={" "}
                <strong
                  aria-label={`정산 합계 ${formatWon(settlement.totalAmount)}`}
                >
                  {formatWon(settlement.totalAmount)}
                </strong>
              </p>
              {settlement.note ? (
                <p className="subtle">{settlement.note}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty">정산 데이터가 없습니다.</p>
      )}
    </section>
  );
};

const renderClaims = (
  module: "claims",
  data: PlatformData,
  onSubmitStatus: (event: FormEvent<HTMLFormElement>) => void,
): ReactNode => {
  const moduleMeta = operationsModuleMeta[module];
  const { claimDraft } = data;

  return (
    <section
      key={module}
      className={`panel panel-ops ${moduleMeta.panelClass}`}
    >
      <div className="panel-head">
        <span className="panel-chip">{moduleMeta.panelChip}</span>
        <h2>{moduleMeta.panelTitle}</h2>
        <p className="subtle">{moduleMeta.panelDescription}</p>
      </div>

      <form className="row" onSubmit={onSubmitStatus}>
        <RouteField id={`claim-recipient-${module}`} label="보호자명">
          <input
            id={`claim-recipient-${module}`}
            type="text"
            value={claimDraft.recipient}
            onChange={(event) =>
              data.updateClaimField("recipient", event.target.value)
            }
            placeholder="예: 김보호자"
            required
          />
        </RouteField>

        <RouteField id={`claim-hospital-${module}`} label="기관/병원">
          <input
            id={`claim-hospital-${module}`}
            type="text"
            value={claimDraft.hospitalName}
            onChange={(event) =>
              data.updateClaimField("hospitalName", event.target.value)
            }
            placeholder="예: 희망요양병원"
            required
          />
        </RouteField>

        <RouteField id={`claim-amount-${module}`} label="예상 청구액">
          <input
            id={`claim-amount-${module}`}
            type="number"
            value={claimDraft.expectedAmount}
            min={1}
            onChange={(event) =>
              data.updateClaimField(
                "expectedAmount",
                Number(event.target.value) || 0,
              )
            }
            required
          />
        </RouteField>

        <RouteField id={`claim-date-${module}`} label="접수일">
          <input
            id={`claim-date-${module}`}
            type="date"
            value={claimDraft.issueDate}
            onChange={(event) =>
              data.updateClaimField("issueDate", event.target.value)
            }
          />
        </RouteField>

        <RouteField id={`claim-status-${module}`} label="초기 상태">
          <select
            id={`claim-status-${module}`}
            value={claimDraft.status}
            onChange={(event) =>
              data.updateClaimField(
                "status",
                event.target.value as ClaimPayload["status"],
              )
            }
          >
            {claimStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </RouteField>

        <RouteField id={`claim-note-${module}`} label="특이사항">
          <input
            id={`claim-note-${module}`}
            type="text"
            value={claimDraft.note}
            onChange={(event) =>
              data.updateClaimField("note", event.target.value)
            }
            placeholder="특이 상황 메모"
          />
        </RouteField>

        <button type="submit" className="btn btn-primary">
          보험청구 등록
        </button>
      </form>

      {data.claims.length > 0 ? (
        <ul className="list" aria-label="보험청구 목록">
          {data.claims.slice(0, 3).map((claim) => (
            <li key={claim.id} className="claim-row">
              <div className="claim-title">
                <div>
                  <strong>{claim.recipient}</strong> · {claim.hospitalName}
                </div>
                <span
                  className={`status-pill ${claimStatusClass(claim.status)}`}
                >
                  {claim.status}
                </span>
              </div>
              <p
                aria-label={`보험청구 금액 ${formatWon(claim.expectedAmount)}, 접수일 ${claim.issueDate}`}
              >
                청구액 {formatWon(claim.expectedAmount)} · 접수일{" "}
                {claim.issueDate}
              </p>

              <label className="inline-label">
                상태 변경
                <select
                  value={claim.status}
                  className={`status-select ${claimStatusClass(claim.status)}`}
                  onChange={(event) =>
                    void data.updateClaimStatus(
                      claim.id,
                      event.target.value as ClaimPayload["status"],
                    )
                  }
                  disabled={data.updatingClaimId === claim.id}
                  aria-label={`${claim.recipient} 청구 상태 변경`}
                >
                  {claimStatusOptions.map((status) => (
                    <option key={`${claim.id}-${status}`} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty">보험청구 항목이 없습니다.</p>
      )}
    </section>
  );
};

const renderSectionGuide = ({
  approvalRate,
  nextAction,
}: {
  approvalRate: number;
  nextAction: string;
}): ReactNode => (
  <section className="panel panel-summary">
    <div className="panel-head">
      <h2>운영 전환 가이드</h2>
      <p className="subtle">
        청구 승인률을 높이려면 신규 청구 처리 후 정산 연결 시간을 줄이세요.
      </p>
    </div>
    <div className="kpi-ribbons">
      <article className="kpi-ribbon">
        <p>권장</p>
        <strong>정기 상태 동기화</strong>
        <span className="small-note">분기별로 미승인 목록을 점검</span>
      </article>
      <article className="kpi-ribbon">
        <p>상태</p>
        <strong>현재 목표 승인률 {formatRate(approvalRate)}</strong>
        <span className="small-note">현재 목표: {nextAction}</span>
      </article>
    </div>
  </section>
);

const OperationsPage = ({
  modules,
  compositionMeta,
  data,
  onNavigate,
  activeRoutePath,
}: OperationsPageProps) => {
  const moduleRenderers: Record<OperationsRouteModule, () => ReactNode> = {
    overview: () =>
      renderOverview({
        activeHouseholds: data.activeHouseholds,
        pendingClaims: data.pendingClaims,
        totalSettlement: data.totalSettlement,
        approvalRate: data.approvalRate,
        claims: data.claims,
        totalClaimExpected: data.totalClaimExpected,
      }),
    care: () => renderCareForm("care", data, data.submitCareLog),
    settlement: () =>
      renderSettlementForm("settlement", data, data.submitSettlement),
    claims: () => renderClaims("claims", data, data.submitClaim),
  };

  return (
    <section className="view-stack">
      <section
        className={`panel panel-overview ${compositionMeta.compositionPanelClass}`}
      >
        <div className="panel-head">
          <div className="panel-title-wrap">
            <span className="panel-chip">
              {compositionMeta.compositionChip}
            </span>
            <h2>{compositionMeta.compositionTitle}</h2>
          </div>
          <p className="subtle">{compositionMeta.compositionDescription}</p>
        </div>

        <div
          className="module-composition"
          role="list"
          aria-label="현재 페이지 구성요소"
        >
          {modules.map((moduleName) => {
            const config = operationsModuleMeta[moduleName];
            const path = operationsModuleRoute[moduleName];
            const isActiveModule = path === activeRoutePath;
            return (
              <button
                type="button"
                role="listitem"
                key={moduleName}
                className={`module-composition-item ${isActiveModule ? "module-composition-item-current" : ""}`}
                onClick={() => onNavigate(path)}
                aria-label={`${config.title}로 ${isActiveModule ? "현재 보기" : "이동"}`}
                aria-current={isActiveModule ? "page" : undefined}
                title={config.note}
              >
                <p className="subtle" aria-hidden="true">
                  {config.chip}
                </p>
                <strong>{config.title}</strong>
                <p>{config.note}</p>
              </button>
            );
          })}
        </div>
      </section>

      {modules.map((moduleName) => (
        <div className="panel-stack-item" key={moduleName}>
          {moduleRenderers[moduleName]()}
        </div>
      ))}

      {renderSectionGuide({
        approvalRate: data.approvalRate,
        nextAction: "미승인 청구 조치 우선 처리",
      })}
    </section>
  );
};

export { OperationsPage };
