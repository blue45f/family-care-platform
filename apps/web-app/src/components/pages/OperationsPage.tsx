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
  operationsModuleSequence,
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
          <h2>오늘 확인할 돌봄 현황</h2>
        </div>
        <p className="subtle">
          돌봄 기록, 정산, 보험청구 중 먼저 확인할 일을 보여줍니다.
        </p>
      </div>

      <div className="kpi-ribbons">
        <article className="kpi-ribbon">
          <p>돌봄 가구</p>
          <strong>{activeHouseholds}개</strong>
        </article>
        <article className="kpi-ribbon">
          <p>확인할 청구</p>
          <strong>{pendingClaims}건</strong>
        </article>
        <article className="kpi-ribbon">
          <p>이번 달 정산</p>
          <strong>{formatWon(totalSettlement)}</strong>
        </article>
        <article className="kpi-ribbon">
          <p>청구 승인률</p>
          <strong>{formatRate(approvalRate)}</strong>
        </article>
      </div>

      <div className="kpi-table-wrap">
        <table className="kpi-table">
          <caption className="sr-only">돌봄 관리 현황</caption>
          <thead>
            <tr>
              <th scope="col">항목</th>
              <th scope="col">현재 수치</th>
              <th scope="col">다음 할 일</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">돌봄 기록</th>
              <td>
                <strong>{claims.length}건</strong>
              </td>
              <td>새 돌봄 기록 남기기</td>
            </tr>
            <tr>
              <th scope="row">확인할 청구</th>
              <td>
                <strong>{pendingClaims}건</strong>
              </td>
              <td>청구 상태 확인하기</td>
            </tr>
            <tr>
              <th scope="row">청구 예상 금액</th>
              <td>
                <strong>{formatWon(totalClaimExpected)}</strong>
              </td>
              <td>정산 내용과 함께 확인하기</td>
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
  isSubmitting: boolean,
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
        <RouteField id={`care-recipient-${module}`} label="돌봄 받는 분">
          <input
            id={`care-recipient-${module}`}
            type="text"
            value={careLogDraft.recipient}
            onChange={(event) =>
              data.updateCareLogField("recipient", event.target.value)
            }
            placeholder="예: 김영희"
            required
          />
        </RouteField>

        <RouteField id={`caregiver-${module}`} label="돌봄 담당자">
          <input
            id={`caregiver-${module}`}
            type="text"
            value={careLogDraft.caregiver}
            onChange={(event) =>
              data.updateCareLogField("caregiver", event.target.value)
            }
            placeholder="예: 박돌봄"
            required
          />
        </RouteField>

        <RouteField id={`care-type-${module}`} label="돌봄 종류">
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

        <RouteField id={`care-date-${module}`} label="돌봄 날짜">
          <input
            id={`care-date-${module}`}
            type="date"
            value={careLogDraft.date}
            onChange={(event) =>
              data.updateCareLogField("date", event.target.value)
            }
          />
        </RouteField>

        <RouteField id={`care-note-${module}`} label="돌봄 내용">
          <textarea
            id={`care-note-${module}`}
            value={careLogDraft.note}
            onChange={(event) =>
              data.updateCareLogField("note", event.target.value)
            }
            placeholder="예: 점심 식사 도움, 약 복용 확인"
            required
            rows={3}
          />
        </RouteField>

        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "저장 중..." : "기록 저장"}
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
        <p className="empty">
          아직 돌봄 기록이 없습니다. 오늘 있었던 일을 먼저 남겨보세요.
        </p>
      )}
    </section>
  );
};

const renderSettlementForm = (
  module: "settlement",
  data: PlatformData,
  onSubmitStatus: (event: FormEvent<HTMLFormElement>) => void,
  isSubmitting: boolean,
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
        <RouteField id={`settlement-recipient-${module}`} label="돌봄 받는 분">
          <input
            id={`settlement-recipient-${module}`}
            type="text"
            value={settlementDraft.recipient}
            onChange={(event) =>
              data.updateSettlementField("recipient", event.target.value)
            }
            placeholder="예: 김영희"
            required
          />
        </RouteField>

        <RouteField id={`settlement-date-${module}`} label="정산 날짜">
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

        <RouteField id={`settlement-rate-${module}`} label="시간당 금액">
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
            placeholder="예: 야간 돌봄 포함"
          />
        </RouteField>

        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "저장 중..." : "정산 저장"}
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
        <p className="empty">
          아직 정산 내역이 없습니다. 돌봄 시간과 금액을 입력해 보세요.
        </p>
      )}
    </section>
  );
};

const renderClaims = (
  module: "claims",
  data: PlatformData,
  onSubmitStatus: (event: FormEvent<HTMLFormElement>) => void,
  isSubmitting: boolean,
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
        <RouteField id={`claim-recipient-${module}`} label="돌봄 받는 분">
          <input
            id={`claim-recipient-${module}`}
            type="text"
            value={claimDraft.recipient}
            onChange={(event) =>
              data.updateClaimField("recipient", event.target.value)
            }
            placeholder="예: 김영희"
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

        <RouteField id={`claim-amount-${module}`} label="청구 예상 금액">
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

        <RouteField id={`claim-date-${module}`} label="접수 날짜">
          <input
            id={`claim-date-${module}`}
            type="date"
            value={claimDraft.issueDate}
            onChange={(event) =>
              data.updateClaimField("issueDate", event.target.value)
            }
          />
        </RouteField>

        <RouteField id={`claim-status-${module}`} label="현재 상태">
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

        <RouteField id={`claim-note-${module}`} label="메모">
          <input
            id={`claim-note-${module}`}
            type="text"
            value={claimDraft.note}
            onChange={(event) =>
              data.updateClaimField("note", event.target.value)
            }
            placeholder="예: 영수증 확인 필요"
          />
        </RouteField>

        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "저장 중..." : "청구 저장"}
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
                진행 상태
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
        <p className="empty">
          아직 보험청구 내역이 없습니다. 병원/기관과 예상 금액을 입력해 보세요.
        </p>
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
      <h2>다음에 확인할 일</h2>
      <p className="subtle">
        지금 기준으로 바로 이어서 해야 할 작업이 명확해집니다.
      </p>
    </div>
    <div className="kpi-ribbons">
      <article className="kpi-ribbon">
        <p>추천</p>
        <strong>{nextAction}</strong>
        <span className="small-note">아래 순서로 진행하면 누락이 줄어듭니다.</span>
      </article>
      <article className="kpi-ribbon">
        <p>현재</p>
        <strong>청구 승인률 {formatRate(approvalRate)}</strong>
        <span className="small-note">목표: 청구 상태 정합성 유지</span>
      </article>
    </div>
  </section>
);

const getOperationsActiveModule = (
  modules: readonly OperationsRouteModule[],
  activeRoutePath: NonHomeRoutePath,
): OperationsRouteModule => {
  if (activeRoutePath === "/operations") {
    return "overview";
  }

  return (
    modules.find((moduleName) => operationsModuleRoute[moduleName] === activeRoutePath) ??
    "overview"
  );
};

const getOperationsFocusModules = (
  modules: readonly OperationsRouteModule[],
  activeRoutePath: NonHomeRoutePath,
): OperationsRouteModule[] => {
  const ordered = modules.length > 0 ? modules : operationsModuleSequence;

  if (activeRoutePath === "/operations") {
    return ordered.includes("care") ? ["overview", "care"] : ["overview"];
  }

  const activeModule = getOperationsActiveModule(ordered, activeRoutePath);
  const activeIndex = ordered.indexOf(activeModule);

  if (activeIndex < 0) {
    return ["overview", "care", "settlement"];
  }

  const previous = ordered[activeIndex - 1];
  const next = ordered[activeIndex + 1];

  return Array.from(new Set([previous, activeModule, next].filter(Boolean) as OperationsRouteModule[]));
};

const getOperationsNextAction = (
  modules: readonly OperationsRouteModule[],
  activeRoutePath: NonHomeRoutePath,
): string => {
  if (activeRoutePath === "/operations") {
    return "돌봄 기록 입력";
  }

  const ordered = modules.length > 0 ? modules : operationsModuleSequence;
  const activeModule = getOperationsActiveModule(ordered, activeRoutePath);
  const activeIndex = ordered.indexOf(activeModule);
  const next = activeIndex >= 0 ? ordered[activeIndex + 1] : undefined;

  if (!next) {
    return "목록에서 미처리 항목을 점검";
  }

  return `${operationsModuleMeta[next].title}로 이동`;
};

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
    care: () =>
      renderCareForm("care", data, data.submitCareLog, data.isSubmittingCareLog),
    settlement: () =>
      renderSettlementForm(
        "settlement",
        data,
        data.submitSettlement,
        data.isSubmittingSettlement,
      ),
    claims: () => renderClaims("claims", data, data.submitClaim, data.isSubmittingClaim),
  };

  const visibleModules = getOperationsFocusModules(modules, activeRoutePath);
  const nextAction = getOperationsNextAction(modules, activeRoutePath);

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

      {modules.map((moduleName) => {
        if (!visibleModules.includes(moduleName)) {
          return null;
        }

        return (
          <div className="panel-stack-item" key={moduleName}>
            {moduleRenderers[moduleName]()}
          </div>
        );
      })}

      {renderSectionGuide({
        approvalRate: data.approvalRate,
        nextAction,
      })}
    </section>
  );
};

export { OperationsPage };
