import { unit6Fixture } from "../src/fixtures/index.js";
import { Unit6FixtureSchema } from "../src/schemas/index.js";

const fixture = Unit6FixtureSchema.parse(unit6Fixture);

const fail = (message: string): never => {
  throw new Error(message);
};

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    fail(message);
  }
};

const assertUnique = (values: string[], label: string) => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }
  assert(duplicates.size === 0, `${label} contains duplicates: ${[...duplicates].join(", ")}`);
};

assert(fixture.knowledge_nodes.length === 128, "Expected 128 knowledge nodes");
assert(fixture.knowledge_edges.length === 669, "Expected 669 knowledge edges");
assert(fixture.tasks.length === 91, "Expected 91 tasks");
assert(fixture.sample_path_rows.length === 36, "Expected 36 sample path rows");

assertUnique(
  fixture.knowledge_nodes.map((node) => node.node_id),
  "knowledge node IDs",
);
assertUnique(
  fixture.knowledge_edges.map((edge) => edge.edge_id),
  "knowledge edge IDs",
);
assertUnique(
  fixture.tasks.map((task) => task.task_id),
  "task IDs",
);
assertUnique(
  fixture.task_annotations.map((annotation) => annotation.annotation_id),
  "task annotation IDs",
);

const nodeIds = new Set(fixture.knowledge_nodes.map((node) => node.node_id));
const taskIds = new Set(fixture.tasks.map((task) => task.task_id));
const graphObjectIds = new Set([...nodeIds, ...taskIds]);

for (const node of fixture.knowledge_nodes) {
  if (node.parent_id) {
    assert(nodeIds.has(node.parent_id), `Node ${node.node_id} has missing parent ${node.parent_id}`);
  }
}

for (const edge of fixture.knowledge_edges) {
  assert(graphObjectIds.has(edge.source_id), `Edge ${edge.edge_id} has missing source ${edge.source_id}`);
  assert(graphObjectIds.has(edge.target_id), `Edge ${edge.edge_id} has missing target ${edge.target_id}`);
}

for (const task of fixture.tasks) {
  for (const nodeId of [...task.primary_node_ids, ...task.secondary_node_ids]) {
    assert(nodeIds.has(nodeId), `Task ${task.task_id} references missing node ${nodeId}`);
  }
}

for (const row of fixture.sample_path_rows) {
  assert(taskIds.has(row.task_id), `Sample path ${row.path_id} step ${row.step_no} references missing task ${row.task_id}`);
  for (const nodeId of row.target_node_ids) {
    assert(nodeIds.has(nodeId), `Sample path ${row.path_id} step ${row.step_no} references missing node ${nodeId}`);
  }
}

for (const annotation of fixture.task_annotations) {
  assert(taskIds.has(annotation.task_id), `Annotation ${annotation.annotation_id} references missing task ${annotation.task_id}`);
  for (const nodeId of annotation.knowledge_node_ids) {
    assert(nodeIds.has(nodeId), `Annotation ${annotation.annotation_id} references missing node ${nodeId}`);
  }
}

const pathIds = new Set(fixture.sample_path_rows.map((row) => row.path_id));
assert(pathIds.size === 6, `Expected 6 distinct sample paths, got ${pathIds.size}`);

const riskDistribution = fixture.tasks.reduce(
  (accumulator, task) => {
    accumulator[task.review_risk] += 1;
    return accumulator;
  },
  { 低: 0, 中: 0, 高: 0 },
);
assert(riskDistribution.低 === 55, `Expected 55 low-risk tasks, got ${riskDistribution.低}`);
assert(riskDistribution.中 === 23, `Expected 23 medium-risk tasks, got ${riskDistribution.中}`);
assert(riskDistribution.高 === 13, `Expected 13 high-risk tasks, got ${riskDistribution.高}`);

const reviewCaseObjectIds = new Set(fixture.review_cases.map((reviewCase) => reviewCase.object_id));
for (const annotation of fixture.task_annotations) {
  if (annotation.lint_status === "REVIEW" || annotation.lint_status === "BLOCK") {
    assert(
      reviewCaseObjectIds.has(annotation.annotation_id),
      `Annotation ${annotation.annotation_id} is ${annotation.lint_status} without ReviewCase`,
    );
  }
}

console.log("Unit 6 data validation passed");
console.log(
  JSON.stringify(
    {
      nodes: fixture.knowledge_nodes.length,
      edges: fixture.knowledge_edges.length,
      tasks: fixture.tasks.length,
      sample_path_rows: fixture.sample_path_rows.length,
      distinct_sample_paths: pathIds.size,
      risk_distribution: riskDistribution,
    },
    null,
    2,
  ),
);
