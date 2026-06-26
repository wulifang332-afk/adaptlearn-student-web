import type {
  ProfileSummary,
  ProgressSummary,
  StudentHome,
  StudentPath,
  StudentTask,
  SubmissionRequest,
  SubmissionResponse,
} from "@adaptlearn/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

const jsonHeaders = {
  "content-type": "application/json",
  "x-mock-role": "student",
};

async function fetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...jsonHeaders,
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${body}`);
  }
  return response.json() as Promise<T>;
}

export const studentApi = {
  getHome: () => fetchJson<StudentHome>("/v1/student/home"),
  getPath: (pathId: string) => fetchJson<StudentPath>(`/v1/student/path/${encodeURIComponent(pathId)}`),
  getTask: (taskId: string) =>
    fetchJson<{ mock: true; simulationNotice: string; task: StudentTask }>(
      `/v1/student/tasks/${encodeURIComponent(taskId)}`,
    ),
  submitTask: (taskId: string, request: SubmissionRequest) =>
    fetchJson<SubmissionResponse>(`/v1/student/tasks/${encodeURIComponent(taskId)}/submissions`, {
      method: "POST",
      body: JSON.stringify(request),
    }),
  startSimilar: (taskId: string) =>
    fetchJson<{ similarTaskId: string; task: StudentTask; agentRunId: string }>(
      `/v1/student/tasks/${encodeURIComponent(taskId)}/similar`,
      { method: "POST", body: JSON.stringify({}) },
    ),
  getProgress: () => fetchJson<ProgressSummary & { mock: true; simulationNotice: string }>("/v1/student/progress"),
  getProfile: () => fetchJson<ProfileSummary & { mock: true; simulationNotice: string }>("/v1/student/profile"),
};
