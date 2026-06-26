export function createIdempotencyKey(taskId: string): string {
  const random = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `student-web-${taskId}-${random}`;
}
