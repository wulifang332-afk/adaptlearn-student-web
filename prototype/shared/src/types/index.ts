import type { z } from "zod";
import type {
  BKTKnowledgeStateSchema,
  BloomEvidenceProfileSchema,
  ClassSchema,
  DecisionTraceSchema,
  IRTAbilityStateSchema,
  KnowledgeEdgeSchema,
  KnowledgeNodeSchema,
  LearnerProfileSchema,
  LearningPathSchema,
  LmsSyncStatusSchema,
  MediaUploadSchema,
  OrganizationSchema,
  PathStepSchema,
  PersonaSchema,
  ReviewCaseSchema,
  RuleEvaluationSchema,
  SamplePathRowSchema,
  StudentSchema,
  StudentSubmissionSchema,
  TaskAnnotationSchema,
  TaskSchema,
  TeacherAuditExplanationSchema,
  ThinkingQualityProfileSchema,
  TraceEventSchema,
  Unit6FixtureSchema,
  UnitMetadataSchema,
  UserSchema,
  VerifierResultSchema,
} from "../schemas/index.js";

export type UnitMetadata = z.infer<typeof UnitMetadataSchema>;
export type User = z.infer<typeof UserSchema>;
export type Organization = z.infer<typeof OrganizationSchema>;
export type Class = z.infer<typeof ClassSchema>;
export type Student = z.infer<typeof StudentSchema>;
export type KnowledgeNode = z.infer<typeof KnowledgeNodeSchema>;
export type KnowledgeEdge = z.infer<typeof KnowledgeEdgeSchema>;
export type BKTKnowledgeState = z.infer<typeof BKTKnowledgeStateSchema>;
export type IRTAbilityState = z.infer<typeof IRTAbilityStateSchema>;
export type BloomEvidenceProfile = z.infer<typeof BloomEvidenceProfileSchema>;
export type ThinkingQualityProfile = z.infer<typeof ThinkingQualityProfileSchema>;
export type LearnerProfile = z.infer<typeof LearnerProfileSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type TaskAnnotation = z.infer<typeof TaskAnnotationSchema>;
export type PathStep = z.infer<typeof PathStepSchema>;
export type RuleEvaluation = z.infer<typeof RuleEvaluationSchema>;
export type VerifierResult = z.infer<typeof VerifierResultSchema>;
export type TeacherAuditExplanation = z.infer<typeof TeacherAuditExplanationSchema>;
export type LearningPath = z.infer<typeof LearningPathSchema>;
export type ReviewCase = z.infer<typeof ReviewCaseSchema>;
export type StudentSubmission = z.infer<typeof StudentSubmissionSchema>;
export type MediaUpload = z.infer<typeof MediaUploadSchema>;
export type DecisionTrace = z.infer<typeof DecisionTraceSchema>;
export type LmsSyncStatus = z.infer<typeof LmsSyncStatusSchema>;
export type TraceEvent = z.infer<typeof TraceEventSchema>;
export type SamplePathRow = z.infer<typeof SamplePathRowSchema>;
export type Persona = z.infer<typeof PersonaSchema>;
export type Unit6Fixture = z.infer<typeof Unit6FixtureSchema>;
