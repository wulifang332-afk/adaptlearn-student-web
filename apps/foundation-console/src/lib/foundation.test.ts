import { describe, expect, it } from "vitest";
import { foundationPages, studentForbiddenFieldTokens, studentSafeProjectionPreview } from "./foundation";

describe("foundation registry", () => {
  it("covers every MVP Foundational Console page", () => {
    expect(foundationPages.map((page) => page.label)).toEqual([
      "System Overview",
      "Organization & Tenant Settings",
      "User / Role / Class Scope Management",
      "Supabase / Database Health",
      "RLS Policy Viewer / Test Runner",
      "Storage Bucket Manager",
      "RAG Source Manager",
      "Embedding / Vector Index Monitor",
      "Agent Workflow Registry",
      "Tool / MCP / API Connector Registry",
      "Queue / Job Monitor",
      "LMS Connector Settings",
      "Audit Log Explorer",
      "Environment & Secrets Checklist",
      "System Health / Monitoring",
      "Schema / CRUD Generator Console",
    ]);
  });

  it("keeps forbidden internals out of the student-safe projection preview", () => {
    const safeText = studentSafeProjectionPreview.fields.map((field) => `${field.label} ${field.value}`).join(" ");

    for (const token of studentForbiddenFieldTokens) {
      expect(safeText).not.toContain(token);
    }
  });
});
