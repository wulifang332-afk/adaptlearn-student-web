export const USER_ROLES = [
  "student",
  "teacher",
  "curriculum_researcher",
  "expert",
  "admin",
] as const;

export const ACTOR_ROLES = [...USER_ROLES, "lms"] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type ActorRole = (typeof ACTOR_ROLES)[number];

export const ROLE_LABELS: Record<ActorRole, string> = {
  student: "Student",
  teacher: "English teacher",
  curriculum_researcher: "Curriculum researcher",
  expert: "Expert",
  admin: "System admin",
  lms: "LMS",
};

export const STAFF_ROLES = [
  "teacher",
  "curriculum_researcher",
  "expert",
  "admin",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];
