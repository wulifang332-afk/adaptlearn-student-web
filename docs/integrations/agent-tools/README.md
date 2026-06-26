# Agent And Tool Audit Contract

Every agent workflow must create an `agent_runs` row before it calls external systems. Every external or side-effecting tool call must create a `tool_calls` row with `agent_run_id`, `tool_name`, `input_ref`, `output_ref`, `status`, safety status, and citation ids where applicable.

Initial workflows:

- `grade_objective_task`
- `transcribe_speaking`
- `feedback_speaking`
- `generate_similar_practice`
- `rag_ingestion`
- `rag_search`
- `lms_sync`

Student-facing output must be projected through safe fields only. It must not include internal rule weights, teacher audit notes, ReviewCase details, other-student data, exact rank, BKT probabilities, IRT theta, or hidden rubric details.
