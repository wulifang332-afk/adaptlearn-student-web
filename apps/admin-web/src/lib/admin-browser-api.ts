import type { DecisionTrace, DecisionTraceAction } from "./admin-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
const ADMIN_DATA_SOURCE = process.env.NEXT_PUBLIC_ADMIN_DATA_SOURCE ?? "mock";

export async function postPathDecision(input: {
  pathId: string;
  pathVersion: number;
  action: DecisionTraceAction;
  reason?: string;
}): Promise<DecisionTrace | null> {
  if (ADMIN_DATA_SOURCE !== "api") {
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/v1/admin/paths/${encodeURIComponent(input.pathId)}/decision`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-mock-role": "teacher",
    },
    body: JSON.stringify({
      pathVersion: input.pathVersion,
      action: input.action,
      reason: input.reason,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${body}`);
  }

  const payload = (await response.json()) as { decisionTrace?: DecisionTrace };
  return payload.decisionTrace ?? null;
}
