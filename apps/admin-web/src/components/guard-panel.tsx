import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { PublishGuardResult } from "@/lib/admin-types";
import { StatusBadge } from "./status-badge";

export function GuardPanel({ result }: { result: PublishGuardResult }) {
  return (
    <section className={result.allowed ? "guard-panel guard-pass" : "guard-panel guard-stop"}>
      <div className="guard-icon">{result.allowed ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}</div>
      <div>
        <span className="guard-title">
          {result.allowed ? "Publish guard passed" : "Publish guard blocked"}
          <StatusBadge tone={result.allowed ? "success" : "blocked"}>{result.code}</StatusBadge>
        </span>
        <p>{result.message}</p>
        {!result.allowed && result.reviewCaseIds?.length ? <small>Blocking cases: {result.reviewCaseIds.join(", ")}</small> : null}
      </div>
    </section>
  );
}
