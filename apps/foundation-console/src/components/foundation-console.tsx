"use client";

import {
  Activity,
  Building2,
  Database,
  FileSearch,
  GraduationCap,
  HardDrive,
  HeartPulse,
  KeyRound,
  ListChecks,
  Network,
  Plug,
  ScrollText,
  ShieldCheck,
  UsersRound,
  WandSparkles,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  foundationNavGroups,
  foundationPages,
  type FoundationCheck,
  type FoundationMetric,
  type FoundationPage,
  type FoundationPageId,
  type FoundationRegistryRow,
  type FoundationStatus,
  type FoundationTone,
} from "@/lib/foundation";
import type { FoundationRegistrySection } from "@/lib/foundation-api";
import type { FoundationReadinessSnapshot } from "@/lib/foundation-readiness";

const iconMap: Record<string, LucideIcon> = {
  activity: Activity,
  building: Building2,
  users: UsersRound,
  database: Database,
  shield: ShieldCheck,
  storage: HardDrive,
  "file-search": FileSearch,
  network: Network,
  workflow: Workflow,
  plug: Plug,
  "list-checks": ListChecks,
  graduation: GraduationCap,
  scroll: ScrollText,
  key: KeyRound,
  heart: HeartPulse,
  wand: WandSparkles,
};

export function FoundationShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="foundation-app">
      <aside className="foundation-sidebar" aria-label="Foundational Console navigation">
        <Link className="foundation-brand" href="/foundation">
          <span className="foundation-brand-mark" aria-hidden="true">
            <Activity size={20} />
          </span>
          <span>
            <strong>AdaptLearn</strong>
            <small>Foundational Console</small>
          </span>
        </Link>

        <nav className="foundation-nav">
          {foundationNavGroups.map((group) => (
            <section key={group.label} className="foundation-nav-group" aria-label={group.label}>
              <p>{group.label}</p>
              {group.items.map((item) => {
                const Icon = iconMap[item.icon] ?? Activity;
                const active = pathname === item.href;
                return (
                  <Link key={item.href} className={active ? "active" : ""} href={item.href}>
                    <Icon size={16} aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </section>
          ))}
        </nav>
      </aside>

      <section className="foundation-main">{children}</section>
    </main>
  );
}

export function FoundationConsolePage({ page, readiness }: { page: FoundationPage; readiness: FoundationReadinessSnapshot }) {
  return (
    <div className="foundation-page">
      <header className="foundation-page-header">
        <div>
          <p className="foundation-surface-label">Platform foundation</p>
          <h1>{page.label}</h1>
          <p>{page.purpose}</p>
        </div>
        <div className="foundation-header-meta" aria-label="Page trace metadata">
          <span>mock: true</span>
          <span>readiness: {readiness.source}</span>
          <span>api status: {formatStatus(readiness.status)}</span>
          <span>{page.mockNotice}</span>
          <code>{page.primaryTraceId}</code>
          <code>{readiness.traceId}</code>
        </div>
      </header>

      {page.id === "overview" && <FoundationOverview readiness={readiness} />}

      <section className="foundation-metric-grid" aria-label={`${page.label} status metrics`}>
        {page.metrics.map((metric) => (
          <MetricTile key={`${page.id}-${metric.label}`} metric={metric} />
        ))}
      </section>

      <div className="foundation-two-column">
        <section className="foundation-panel">
          <PanelHeader title="Readiness Checks" traceId={page.primaryTraceId} />
          <div className="foundation-check-list">
            {page.checks.map((check) => (
              <CheckRow key={`${page.id}-${check.traceId}`} check={check} />
            ))}
          </div>
        </section>

        <section className="foundation-panel">
          <PanelHeader title="Boundary Warnings" traceId="trc_boundary_panel_001" />
          <div className="foundation-boundary-list">
            {page.boundaries.map((boundary) => (
              <article key={`${page.id}-${boundary.title}`} className={`foundation-boundary tone-${boundary.tone}`}>
                <strong>{boundary.title}</strong>
                <p>{boundary.message}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      {page.id === "environment" && <EnvironmentReadinessPanel readiness={readiness} />}
      {page.id === "rls" && <RlsReadinessPanel readiness={readiness} />}
      {page.id === "generator" && <GeneratorDryRunPanel readiness={readiness} />}

      <FoundationRegistryApiPanel pageId={page.id} readiness={readiness} />

      <section className="foundation-panel">
        <PanelHeader title="Registry Records" traceId={`${page.primaryTraceId}_records`} />
        <RegistryTable rows={page.rows} />
      </section>
    </div>
  );
}

function FoundationRegistryApiPanel({ pageId, readiness }: { pageId: FoundationPageId; readiness: FoundationReadinessSnapshot }) {
  const sections = getRegistrySectionsForPage(pageId, readiness.registries.sections);

  if (sections.length === 0) {
    return null;
  }

  return (
    <section className="foundation-panel" data-testid="foundation-registry-api">
      <PanelHeader title="API Registry Status" traceId={readiness.registries.traceId} />
      <div className="foundation-readiness-summary">
        <div>
          <StatusPill status={readiness.registries.secretValuesReturned ? "BLOCKED" : "PASS"} />
          <strong>{readiness.registries.safeMessage}</strong>
          <p>Raw student data returned: {String(readiness.registries.rawStudentDataReturned)}</p>
        </div>
        <div className="foundation-id-stack">
          <code>{readiness.registries.requestId}</code>
          <code>{readiness.registries.auditLogId}</code>
          <span>sections: {readiness.registries.summary.sectionCount}</span>
          <span>resources: {readiness.registries.summary.resourceCount}</span>
        </div>
      </div>

      <div className="foundation-registry-api-list">
        {sections.map((section) => (
          <RegistryApiSection key={section.registryId} section={section} />
        ))}
      </div>
    </section>
  );
}

function RegistryApiSection({ section }: { section: FoundationRegistrySection }) {
  return (
    <article className="foundation-registry-api-section">
      <div className="foundation-registry-api-heading">
        <div>
          <StatusPill status={section.status} />
          <strong>{section.label}</strong>
          <p>{section.safeMessage}</p>
        </div>
        <div className="foundation-id-stack">
          <span>{section.category}</span>
          <span>{section.owner}</span>
          <code>{section.traceId}</code>
        </div>
      </div>
      <div className="foundation-api-resource-list">
        {section.resources.map((resource) => (
          <article key={resource.resourceId} className="foundation-api-resource">
            <div>
              <StatusPill status={resource.status} />
              <strong>{resource.label}</strong>
              <p>{resource.safeSummary}</p>
            </div>
            <div className="foundation-id-stack">
              <span>{resource.kind}</span>
              <span>{resource.owner}</span>
              <span>{resource.visibleTo}</span>
              <code>{resource.traceId}</code>
              {resource.auditLogId && <code>{resource.auditLogId}</code>}
              {resource.queueJobId && <code>{resource.queueJobId}</code>}
              {resource.agentRunId && <code>{resource.agentRunId}</code>}
              {resource.toolCallId && <code>{resource.toolCallId}</code>}
            </div>
          </article>
        ))}
      </div>
    </article>
  );
}

function FoundationOverview({ readiness }: { readiness: FoundationReadinessSnapshot }) {
  return (
    <div className="foundation-overview-grid">
      <section className="foundation-panel foundation-readiness-panel" data-testid="foundation-readiness-source">
        <PanelHeader title="API Readiness Snapshot" traceId={readiness.traceId} />
        <div className="foundation-readiness-summary">
          <div>
            <StatusPill status={readiness.status} />
            <strong>{readiness.source === "api" ? "Readiness API connected" : "Local fallback active"}</strong>
            <p>{readiness.safeMessage}</p>
          </div>
          <div className="foundation-id-stack">
            <code>{readiness.apiBaseUrl}</code>
            <code>pages:{readiness.pageCount}</code>
            {readiness.requestId && <code>{readiness.requestId}</code>}
            {readiness.auditLogId && <code>{readiness.auditLogId}</code>}
          </div>
        </div>
        {readiness.fallbackReason && <p className="foundation-safe-note">{readiness.fallbackReason}</p>}
        <div className="foundation-boundary-list">
          {readiness.boundaries.map((boundary) => (
            <article key={boundary} className="foundation-boundary tone-good">
              <strong>Boundary</strong>
              <p>{boundary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="foundation-panel foundation-page-index">
        <PanelHeader title="MVP Surface Map" traceId="trc_surface_map_001" />
        <div className="foundation-page-link-grid">
          {readiness.pages.map((apiPage) => {
            const localPage = foundationPages.find((page) => page.id === apiPage.pageId);
            const Icon = iconMap[localPage?.icon ?? "activity"] ?? Activity;
            return (
              <Link key={apiPage.pageId} href={apiPage.route}>
                <Icon size={17} aria-hidden="true" />
                <span>{apiPage.label}</span>
                <code>{apiPage.category}</code>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="foundation-panel">
        <PanelHeader title="Student-Safe Output Preview" traceId={readiness.studentSafePreview.traceId} />
        <div className="foundation-safe-output" data-testid="student-safe-output">
          {readiness.studentSafePreview.fields.map((field) => (
            <div key={field.label}>
              <span>{field.label}</span>
              <strong>{field.value}</strong>
            </div>
          ))}
        </div>
        <p className="foundation-safe-note">
          Projection: {readiness.studentSafePreview.projection}; secret values returned: false.
        </p>
      </section>

      <section className="foundation-panel">
        <PanelHeader title="Blocked From Student Surfaces" traceId="trc_forbidden_fields_001" />
        <div className="foundation-token-list" aria-label="Fields blocked from student-facing safe output">
          {readiness.studentSafePreview.blockedFieldTokens.map((token) => (
            <span key={token}>{token}</span>
          ))}
        </div>
      </section>
    </div>
  );
}

const pageRegistryIds: Record<FoundationPageId, string[]> = {
  overview: [
    "organization",
    "identity",
    "database",
    "storage",
    "rag",
    "agents",
    "tools",
    "jobs",
    "lms",
    "audit",
    "environment",
    "health",
    "generator",
  ],
  organization: ["organization"],
  users: ["identity"],
  database: ["database"],
  rls: ["identity", "database"],
  storage: ["storage"],
  "rag-sources": ["rag"],
  "rag-indexes": ["rag"],
  "agent-workflows": ["agents"],
  tools: ["tools"],
  jobs: ["jobs"],
  lms: ["lms"],
  audit: ["audit"],
  environment: ["environment"],
  health: ["health"],
  generator: ["generator"],
};

function getRegistrySectionsForPage(pageId: FoundationPageId, sections: FoundationRegistrySection[]) {
  const ids = new Set(pageRegistryIds[pageId]);
  return sections.filter((section) => ids.has(section.registryId));
}

function EnvironmentReadinessPanel({ readiness }: { readiness: FoundationReadinessSnapshot }) {
  return (
    <section className="foundation-panel" data-testid="environment-readiness-api">
      <PanelHeader title="API Environment Checks" traceId={readiness.environment.traceId} />
      <div className="foundation-readiness-summary">
        <div>
          <StatusPill status={readiness.environment.browserServiceRoleExposure} />
          <strong>Browser service-role exposure</strong>
          <p>Secret values returned: {String(readiness.environment.secretValuesReturned)}</p>
        </div>
        <div className="foundation-id-stack">
          <code>{readiness.environment.requestId}</code>
          <code>{readiness.environment.auditLogId}</code>
        </div>
      </div>
      <div className="foundation-readiness-list">
        {readiness.environment.checks.map((check) => (
          <article key={check.checkId} className="foundation-readiness-row">
            <div>
              <StatusPill status={check.status} />
              <strong>{check.name}</strong>
              <p>{check.safeMessage}</p>
            </div>
            <div className="foundation-id-stack">
              <span>frontend safe: {String(check.frontendSafe)}</span>
              <span>server only: {String(check.serverOnly)}</span>
              <span>value returned: {String(check.valueReturned)}</span>
              <span>mock: {String(check.mock)}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function RlsReadinessPanel({ readiness }: { readiness: FoundationReadinessSnapshot }) {
  return (
    <section className="foundation-panel" data-testid="rls-readiness-api">
      <PanelHeader title="API RLS Test Runner Results" traceId={readiness.rls.traceId} />
      <div className="foundation-readiness-summary">
        <div>
          <StatusPill status="PASS" />
          <strong>{readiness.rls.runner}</strong>
          <p>Safe diagnostics only: {String(readiness.rls.safeDiagnosticsOnly)}</p>
        </div>
        <div className="foundation-id-stack">
          <code>{readiness.rls.requestId}</code>
          <code>{readiness.rls.auditLogId}</code>
        </div>
      </div>
      <div className="foundation-table-wrap">
        <table className="foundation-table foundation-rls-table">
          <thead>
            <tr>
              <th scope="col">Actor</th>
              <th scope="col">Status</th>
              <th scope="col">Allowed</th>
              <th scope="col">Safe Scenario</th>
              <th scope="col">Trace</th>
            </tr>
          </thead>
          <tbody>
            {readiness.rls.tests.map((test) => (
              <tr key={test.testId}>
                <td>
                  <strong>{test.actorRole}</strong>
                  <code>{test.testId}</code>
                </td>
                <td>
                  <StatusPill status={test.status} />
                </td>
                <td>{String(test.allowed)}</td>
                <td>
                  {test.scenario}
                  <span>raw payload returned: {String(test.rawPayloadReturned)}</span>
                  <span>{test.safeMessage}</span>
                </td>
                <td>
                  <div className="foundation-id-stack">
                    <code>{test.traceId}</code>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function GeneratorDryRunPanel({ readiness }: { readiness: FoundationReadinessSnapshot }) {
  const dryRun = readiness.generatorDryRun;

  return (
    <section className="foundation-panel" data-testid="generator-dry-run-preview">
      <PanelHeader title="API Schema / CRUD Dry-Run Preview" traceId={dryRun.traceId} />
      <div className="foundation-readiness-summary">
        <div>
          <GeneratorStatusPill status={dryRun.status} />
          <strong>{dryRun.crudSpecId}</strong>
          <p>Mode: {dryRun.mode}; writes applied: {String(dryRun.writeApplied)}.</p>
        </div>
        <div className="foundation-id-stack">
          <code>{dryRun.dryRunId}</code>
          <code>{dryRun.requestId}</code>
          <code>{dryRun.auditLogId}</code>
        </div>
      </div>

      <div className="foundation-generator-summary" aria-label="Dry-run guardrails">
        <article>
          <span>Candidates</span>
          <strong>{dryRun.summary.candidateCount}</strong>
        </article>
        <article>
          <span>Generatable</span>
          <strong>{dryRun.summary.generatableCount}</strong>
        </article>
        <article>
          <span>Blocked</span>
          <strong>{dryRun.summary.blockedCount}</strong>
        </article>
        <article>
          <span>Human review</span>
          <strong>{String(dryRun.requiresHumanReview)}</strong>
        </article>
        <article>
          <span>File writes</span>
          <strong>{String(dryRun.fileWritesApplied)}</strong>
        </article>
        <article>
          <span>DB writes</span>
          <strong>{String(dryRun.databaseWritesApplied)}</strong>
        </article>
      </div>

      <div className="foundation-token-list" aria-label="Generator guardrail flags">
        {Object.entries(dryRun.guardrails).map(([flag, enabled]) => (
          <span key={flag} className={enabled ? "token-safe" : undefined}>
            {flag}: {String(enabled)}
          </span>
        ))}
      </div>

      <div className="foundation-table-wrap">
        <table className="foundation-table foundation-generator-table">
          <thead>
            <tr>
              <th scope="col">Candidate</th>
              <th scope="col">Risk</th>
              <th scope="col">Status</th>
              <th scope="col">Safe Diff Preview</th>
              <th scope="col">Artifacts / Trace</th>
            </tr>
          </thead>
          <tbody>
            {dryRun.candidates.map((candidate) => (
              <tr key={candidate.candidateId}>
                <td>
                  <strong>{candidate.candidateId}</strong>
                  <code>{candidate.sourceSchemaRef}</code>
                  <span>{candidate.targetSurface}</span>
                </td>
                <td>
                  <GeneratorStatusPill status={candidate.riskLevel} />
                </td>
                <td>
                  <GeneratorStatusPill status={candidate.status} />
                  <span>allowed: {String(candidate.allowed)}</span>
                  <span>review: {String(candidate.reviewRequired)}</span>
                </td>
                <td>
                  {candidate.safeSummary}
                  <ul className="foundation-diff-list">
                    {candidate.diffSummary.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </td>
                <td>
                  <div className="foundation-id-stack">
                    {candidate.artifactPaths.map((artifactPath) => (
                      <code key={artifactPath}>{artifactPath}</code>
                    ))}
                    <code>{candidate.traceId}</code>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="foundation-boundary-list">
        {dryRun.safeWarnings.map((warning) => (
          <article key={warning} className="foundation-boundary tone-warn">
            <strong>Dry-run boundary</strong>
            <p>{warning}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function MetricTile({ metric }: { metric: FoundationMetric }) {
  return (
    <article className={`foundation-metric tone-${metric.tone}`}>
      <span>{metric.label}</span>
      <strong>{metric.value}</strong>
      <p>{metric.detail}</p>
      <code>{metric.traceId}</code>
    </article>
  );
}

function PanelHeader({ title, traceId }: { title: string; traceId: string }) {
  return (
    <div className="foundation-panel-header">
      <h2>{title}</h2>
      <code>{traceId}</code>
    </div>
  );
}

function CheckRow({ check }: { check: FoundationCheck }) {
  return (
    <article className="foundation-check-row">
      <div>
        <StatusPill status={check.status} />
        <strong>{check.label}</strong>
        <p>{check.safeMessage}</p>
      </div>
      <div className="foundation-id-stack">
        <code>{check.traceId}</code>
        {check.auditLogId && <code>{check.auditLogId}</code>}
        {check.queueJobId && <code>{check.queueJobId}</code>}
        <span>mock: {String(check.mock)}</span>
      </div>
    </article>
  );
}

function RegistryTable({ rows }: { rows: FoundationRegistryRow[] }) {
  return (
    <div className="foundation-table-wrap">
      <table className="foundation-table">
        <thead>
          <tr>
            <th scope="col">Object</th>
            <th scope="col">Status</th>
            <th scope="col">Owner</th>
            <th scope="col">Safe Summary</th>
            <th scope="col">Trace / Refs</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <strong>{row.label}</strong>
                <code>{row.id}</code>
              </td>
              <td>
                <StatusPill status={row.status} />
              </td>
              <td>{row.owner}</td>
              <td>
                {row.summary}
                <span>mock: {String(row.mock)}</span>
              </td>
              <td>
                <div className="foundation-id-stack">
                  <code>{row.traceId}</code>
                  {row.auditLogId && <code>{row.auditLogId}</code>}
                  {row.queueJobId && <code>{row.queueJobId}</code>}
                  {row.agentRunId && <code>{row.agentRunId}</code>}
                  {row.toolCallId && <code>{row.toolCallId}</code>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusPill({ status }: { status: FoundationStatus }) {
  const className = status.toLowerCase().replace("_", "-");
  return <span className={`foundation-status status-${className}`}>{formatStatus(status)}</span>;
}

function GeneratorStatusPill({ status }: { status: string }) {
  const className = status.toLowerCase().replaceAll("_", "-");
  return <span className={`foundation-status status-${className}`}>{formatTokenLabel(status)}</span>;
}

function formatStatus(status: FoundationStatus) {
  return formatTokenLabel(status);
}

function formatTokenLabel(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}
