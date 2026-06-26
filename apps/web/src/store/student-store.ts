"use client";

import type {
  ProfileSummary,
  ProgressSummary,
  StudentHome,
  StudentPath,
  StudentTask,
  SubmissionRequest,
  SubmissionResponse,
} from "@adaptlearn/shared";
import { create } from "zustand";
import { studentApi } from "@/lib/api";

type LoadState = "idle" | "loading" | "ready" | "error";

type StudentStore = {
  home?: StudentHome;
  path?: StudentPath;
  currentTask?: StudentTask;
  progress?: ProgressSummary & { mock: true; simulationNotice: string };
  profile?: ProfileSummary & { mock: true; simulationNotice: string };
  feedbackByTaskId: Record<string, SubmissionResponse>;
  status: LoadState;
  error?: string;
  loadHome: () => Promise<void>;
  loadPath: (pathId: string) => Promise<void>;
  loadTask: (taskId: string) => Promise<void>;
  loadProgress: () => Promise<void>;
  loadProfile: () => Promise<void>;
  submitTask: (taskId: string, request: SubmissionRequest) => Promise<SubmissionResponse>;
  startSimilar: (taskId: string) => Promise<string>;
};

const run = async <T>(set: (state: Partial<StudentStore>) => void, operation: () => Promise<T>): Promise<T> => {
  set({ status: "loading", error: undefined });
  try {
    const result = await operation();
    set({ status: "ready" });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    set({ status: "error", error: message });
    throw error;
  }
};

export const useStudentStore = create<StudentStore>((set, get) => ({
  feedbackByTaskId: {},
  status: "idle",
  loadHome: async () => {
    const home = await run(set, studentApi.getHome);
    set({ home });
  },
  loadPath: async (pathId: string) => {
    const path = await run(set, () => studentApi.getPath(pathId));
    set({ path });
  },
  loadTask: async (taskId: string) => {
    const response = await run(set, () => studentApi.getTask(taskId));
    set({ currentTask: response.task });
  },
  loadProgress: async () => {
    const progress = await run(set, studentApi.getProgress);
    set({ progress });
  },
  loadProfile: async () => {
    const profile = await run(set, studentApi.getProfile);
    set({ profile });
  },
  submitTask: async (taskId: string, request: SubmissionRequest) => {
    const response = await run(set, () => studentApi.submitTask(taskId, request));
    set({
      feedbackByTaskId: {
        ...get().feedbackByTaskId,
        [taskId]: response,
      },
    });
    await Promise.allSettled([get().loadHome(), get().loadPath(request.pathId)]);
    return response;
  },
  startSimilar: async (taskId: string) => {
    const response = await run(set, () => studentApi.startSimilar(taskId));
    set({ currentTask: response.task });
    return response.similarTaskId;
  },
}));
