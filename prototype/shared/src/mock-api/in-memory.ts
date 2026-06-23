import { unit6Fixture } from "../fixtures/index.js";
import { isLearningPathDeliverable } from "../guards/index.js";
import { TeacherDecisionInputSchema, withMockMeta, type MockApiResponse } from "../schemas/index.js";
import type {
  DecisionTrace,
  KnowledgeNode,
  LearnerProfile,
  LearningPath,
  ReviewCase,
  Student,
  StudentSubmission,
  Task,
  TeacherDecisionInput,
  Unit6Fixture,
} from "../types/index.js";

type SubmitTaskInput = {
  learnerId: string;
  taskId: string;
  pathId: string;
  pathVersion: number;
  responsePayloadRef: string;
  idempotencyKey: string;
  offline?: boolean;
};

type StudentHome = {
  student: Student;
  learner_profile: LearnerProfile;
  active_path: LearningPath | undefined;
};

export class InMemoryAdaptLearnMockApi {
  readonly fixture: Unit6Fixture;
  private submissions: StudentSubmission[];
  private reviewCases: ReviewCase[];
  private decisionTraces: DecisionTrace[];

  constructor(fixture: Unit6Fixture = unit6Fixture) {
    this.fixture = fixture;
    this.submissions = structuredClone(fixture.submissions);
    this.reviewCases = structuredClone(fixture.review_cases);
    this.decisionTraces = structuredClone(fixture.decision_traces);
  }

  getUnitOverview(): MockApiResponse<Pick<Unit6Fixture, "unit" | "source_counts" | "personas">> {
    return withMockMeta({
      unit: this.fixture.unit,
      source_counts: this.fixture.source_counts,
      personas: this.fixture.personas,
    });
  }

  listKnowledgeNodes(): MockApiResponse<KnowledgeNode[]> {
    return withMockMeta(this.fixture.knowledge_nodes);
  }

  listTasks(): MockApiResponse<Task[]> {
    return withMockMeta(this.fixture.tasks);
  }

  getTask(taskId: string): MockApiResponse<Task | undefined> {
    return withMockMeta(this.fixture.tasks.find((task) => task.task_id === taskId));
  }

  getLearnerProfile(learnerId: string): MockApiResponse<LearnerProfile | undefined> {
    return withMockMeta(this.fixture.learner_profiles.find((profile) => profile.learner_id === learnerId));
  }

  getLearningPath(pathId: string, learnerId?: string): MockApiResponse<LearningPath | undefined> {
    return withMockMeta(
      this.fixture.learning_paths.find(
        (path) => path.path_id === pathId && (!learnerId || path.learner_id === learnerId),
      ),
    );
  }

  getStudentHome(studentId: string): MockApiResponse<StudentHome | undefined> {
    const student = this.fixture.students.find((candidate) => candidate.student_id === studentId);
    if (!student) {
      return withMockMeta(undefined);
    }

    const learnerProfile = this.fixture.learner_profiles.find((profile) => profile.learner_id === studentId);
    if (!learnerProfile) {
      return withMockMeta(undefined);
    }

    const activePath = learnerProfile.active_path_id
      ? this.fixture.learning_paths.find(
          (path) =>
            path.path_id === learnerProfile.active_path_id &&
            path.learner_id === studentId &&
            isLearningPathDeliverable(path),
        )
      : undefined;

    return withMockMeta({
      student,
      learner_profile: learnerProfile,
      active_path: activePath,
    });
  }

  listReviewCases(): MockApiResponse<ReviewCase[]> {
    return withMockMeta(this.reviewCases);
  }

  listSubmissions(learnerId?: string): MockApiResponse<StudentSubmission[]> {
    return withMockMeta(
      learnerId ? this.submissions.filter((submission) => submission.learner_id === learnerId) : this.submissions,
    );
  }

  submitTask(input: SubmitTaskInput): MockApiResponse<StudentSubmission> {
    const existing = this.submissions.find((submission) => submission.idempotency_key === input.idempotencyKey);
    if (existing) {
      return withMockMeta(existing);
    }

    const task = this.fixture.tasks.find((candidate) => candidate.task_id === input.taskId);
    const highRisk = task?.review_risk === "高";
    const submission: StudentSubmission = {
      submission_id: `sub_${input.learnerId}_${input.taskId}_${this.submissions.length + 1}`,
      learner_id: input.learnerId,
      task_id: input.taskId,
      path_id: input.pathId,
      path_version: input.pathVersion,
      status: input.offline ? "QUEUED_OFFLINE" : highRisk ? "REVIEW_PENDING" : "RECEIVED",
      response_payload_ref: input.responsePayloadRef,
      evidence_ids: [],
      idempotency_key: input.idempotencyKey,
    };

    this.submissions.push(submission);

    if (highRisk && !input.offline) {
      this.reviewCases.push({
        review_case_id: `rc_${submission.submission_id}`,
        object_type: "StudentSubmission",
        object_id: submission.submission_id,
        severity: "REVIEW",
        risk_level: "HIGH",
        owner_user_id: "usr_teacher_01",
        status: "OPEN",
        reason_codes: ["HIGH_RISK_OUTPUT", "TEACHER_REVIEW_REQUIRED"],
      });
    }

    return withMockMeta(submission);
  }

  recordTeacherDecision(input: TeacherDecisionInput): MockApiResponse<DecisionTrace> {
    const parsed = TeacherDecisionInputSchema.parse(input);
    const trace: DecisionTrace = {
      trace_id: `trace_teacher_${parsed.path_id}_${this.decisionTraces.length + 1}`,
      actor_user_id: parsed.actor_user_id,
      action: parsed.action,
      reason_required: parsed.action !== "APPROVE",
      ...(parsed.reason ? { reason_text: parsed.reason } : {}),
      before_snapshot_ref: `learning_path:${parsed.path_id}:v${parsed.path_version}`,
      after_snapshot_ref: `learning_path:${parsed.path_id}:decision:${parsed.action.toLowerCase()}`,
      created_at: "2026-06-23T04:30:00.000Z",
    };

    this.decisionTraces.push(trace);
    return withMockMeta(trace);
  }
}

export const createInMemoryMockApi = (fixture: Unit6Fixture = unit6Fixture) =>
  new InMemoryAdaptLearnMockApi(fixture);
