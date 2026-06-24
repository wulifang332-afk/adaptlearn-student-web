import rawUnit6Fixture from "../../generated/unit6-normalized.json" with { type: "json" };
import { Unit6FixtureSchema } from "../schemas/index.js";

export const unit6Fixture = Unit6FixtureSchema.parse(rawUnit6Fixture);

export const unit6FixtureCounts = {
  nodes: unit6Fixture.knowledge_nodes.length,
  edges: unit6Fixture.knowledge_edges.length,
  tasks: unit6Fixture.tasks.length,
  samplePathRows: unit6Fixture.sample_path_rows.length,
  distinctSamplePaths: new Set(unit6Fixture.sample_path_rows.map((row) => row.path_id)).size,
} as const;
