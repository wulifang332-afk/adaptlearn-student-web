import { expect, test } from "@playwright/test";

const foundationRoutes = [
  ["/foundation", "System Overview"],
  ["/foundation/organization", "Organization & Tenant Settings"],
  ["/foundation/users", "User / Role / Class Scope Management"],
  ["/foundation/database", "Supabase / Database Health"],
  ["/foundation/rls", "RLS Policy Viewer / Test Runner"],
  ["/foundation/storage", "Storage Bucket Manager"],
  ["/foundation/rag/sources", "RAG Source Manager"],
  ["/foundation/rag/indexes", "Embedding / Vector Index Monitor"],
  ["/foundation/agents/workflows", "Agent Workflow Registry"],
  ["/foundation/tools", "Tool / MCP / API Connector Registry"],
  ["/foundation/jobs", "Queue / Job Monitor"],
  ["/foundation/lms", "LMS Connector Settings"],
  ["/foundation/audit", "Audit Log Explorer"],
  ["/foundation/environment", "Environment & Secrets Checklist"],
  ["/foundation/health", "System Health / Monitoring"],
  ["/foundation/generator", "Schema / CRUD Generator Console"],
] as const;

test("Foundational Console routes render MVP sections", async ({ page }) => {
  for (const [route, heading] of foundationRoutes) {
    await page.goto(route);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    await expect(page.getByText("mock: true").first()).toBeVisible();
    await expect(page.getByTestId("foundation-registry-api")).toBeVisible();
    await expect(page.getByText("Registry Records")).toBeVisible();
  }
});

test("student-safe output preview excludes forbidden internal fields", async ({ page }) => {
  await page.goto("/foundation");
  const safeOutput = page.getByTestId("student-safe-output");

  await expect(safeOutput).toBeVisible();
  await expect(safeOutput).toContainText("path_id");
  await expect(safeOutput).toContainText("safe_status");

  for (const token of [
    "ReviewCase",
    "DecisionTrace",
    "component_scores",
    "rule weights",
    "raw BKT",
    "raw IRT",
    "teacher_text",
    "rule_refs",
    "excluded_task_refs",
    "internal citation deliberation",
    "answer_key_or_rubric",
  ]) {
    await expect(safeOutput).not.toContainText(token);
  }
});

test("generator dry-run preview stays read-only and review-gated", async ({ page }) => {
  await page.goto("/foundation/generator");
  const dryRunPreview = page.getByTestId("generator-dry-run-preview");

  await expect(dryRunPreview).toBeVisible();
  await expect(dryRunPreview).toContainText("API Schema / CRUD Dry-Run Preview");
  await expect(dryRunPreview).toContainText("writes applied: false");
  await expect(dryRunPreview).toContainText("File writes");
  await expect(dryRunPreview).toContainText("false");
  await expect(dryRunPreview).toContainText("blocked_student_component_generation");
  await expect(dryRunPreview).toContainText("noStudentFacingAutogeneration: true");
});
