import { getForbiddenStudentProjectionKeys, projectionContainsForbiddenKeys } from "@/lib/admin-workflows";
import type { StudentSafeProjection } from "@/lib/admin-types";
import { StatusBadge } from "./status-badge";

export function SafeProjectionPreview({ projection }: { projection: StudentSafeProjection }) {
  const forbiddenHits = projectionContainsForbiddenKeys(projection);

  return (
    <section className="panel projection-panel">
      <div className="panel-heading">
        <div>
          <span className="section-label">Student-safe projection preview</span>
          <h2>{projection.learnerLabel}</h2>
        </div>
        <StatusBadge tone={forbiddenHits.length === 0 ? "success" : "blocked"}>
          {forbiddenHits.length === 0 ? "No hidden fields" : "Forbidden field leak"}
        </StatusBadge>
      </div>
      <div className="projection-grid">
        <span>Path</span>
        <strong>{projection.goal}</strong>
        <span>Student text</span>
        <strong>{projection.studentText}</strong>
        <span>Status</span>
        <strong>{projection.status}</strong>
        <span>Sync badge</span>
        <strong>{projection.syncBadge}</strong>
      </div>
      <div className="chip-row">
        {projection.safeReasonChips.map((chip) => (
          <span key={chip} className="chip">
            {chip}
          </span>
        ))}
      </div>
      <details>
        <summary>Forbidden keys checked</summary>
        <p>{getForbiddenStudentProjectionKeys().join(", ")}</p>
      </details>
    </section>
  );
}
