import type { DecisionTrace } from "@/lib/admin-types";
import { StatusBadge } from "./status-badge";

export function DecisionTraceTimeline({ traces }: { traces: DecisionTrace[] }) {
  return (
    <ol className="timeline" aria-label="Decision trace timeline">
      {traces.map((trace) => (
        <li key={trace.trace_id}>
          <div className="timeline-dot" />
          <div className="timeline-body">
            <span className="timeline-title">
              {trace.action}
              <StatusBadge tone={trace.reason_required ? "warning" : "success"}>
                {trace.reason_required ? "Reason recorded" : "Trace created"}
              </StatusBadge>
            </span>
            <p>{trace.display_summary}</p>
            {trace.reason_text ? <blockquote>{trace.reason_text}</blockquote> : null}
            <small>
              {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(trace.created_at))} · {trace.trace_id}
            </small>
          </div>
        </li>
      ))}
    </ol>
  );
}
