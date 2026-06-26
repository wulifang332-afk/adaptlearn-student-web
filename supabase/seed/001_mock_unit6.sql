-- Mock-only Unit 6 seed. Do not use real minor data.

insert into public.organizations (id, name, region_label)
values ('org_demo', 'AdaptLearn Demo School', 'ap-northeast-1')
on conflict (id) do update set name = excluded.name, region_label = excluded.region_label;

insert into public.classes (id, organization_id, grade, subject, display_name)
values ('class_104', 'org_demo', '七年级', 'English', 'Class 104')
on conflict (id) do update set display_name = excluded.display_name;

insert into public.user_profiles (id, role, display_name, organization_id, class_ids)
values
  ('00000000-0000-0000-0000-000000000101', 'student', 'Xiaoming Zhang', 'org_demo', array['class_104']),
  ('00000000-0000-0000-0000-000000000201', 'teacher', 'Ms. Chen', 'org_demo', array['class_104']),
  ('00000000-0000-0000-0000-000000000301', 'curriculum_researcher', 'Curriculum Researcher', 'org_demo', '{}'),
  ('00000000-0000-0000-0000-000000000401', 'admin', 'System Admin', 'org_demo', '{}')
on conflict (id) do update
set role = excluded.role,
    display_name = excluded.display_name,
    organization_id = excluded.organization_id,
    class_ids = excluded.class_ids;

insert into public.students (id, user_id, class_id, pseudonymous_label, persona_id)
values ('stu_persona_a', '00000000-0000-0000-0000-000000000101', 'class_104', 'Student A', 'persona_a')
on conflict (id) do update
set user_id = excluded.user_id,
    class_id = excluded.class_id,
    pseudonymous_label = excluded.pseudonymous_label,
    persona_id = excluded.persona_id;

insert into public.class_memberships (class_id, user_id, member_role)
values
  ('class_104', '00000000-0000-0000-0000-000000000101', 'student'),
  ('class_104', '00000000-0000-0000-0000-000000000201', 'teacher')
on conflict (class_id, user_id) do update set member_role = excluded.member_role;

insert into public.role_assignments (user_id, role, organization_id, class_id, scope, created_by)
values
  ('00000000-0000-0000-0000-000000000201', 'teacher', 'org_demo', 'class_104', '{"surface":"admin-web","scope":"assigned_class"}', '00000000-0000-0000-0000-000000000401'),
  ('00000000-0000-0000-0000-000000000301', 'curriculum_researcher', 'org_demo', null, '{"surface":"admin-web","scope":"content_taxonomy_rag"}', '00000000-0000-0000-0000-000000000401'),
  ('00000000-0000-0000-0000-000000000401', 'admin', 'org_demo', null, '{"surface":"foundation-console","scope":"platform_foundation"}', '00000000-0000-0000-0000-000000000401')
on conflict (user_id, role, organization_id, class_id) do update
set scope = excluded.scope,
    status = 'ACTIVE';

insert into public.knowledge_nodes (id, level, module, name, english_label, definition, bkt_eligible, irt_eligible, bloom_target, thinking_primary, priority, review_risk)
values
  ('VOC01', 'concept', 'Plant vocabulary', 'root', 'root', 'The part of a plant usually under soil.', true, true, 'Remember', 'Observation', 'P0', '低'),
  ('VOC02', 'concept', 'Plant vocabulary', 'stem', 'stem', 'The part that supports leaves and flowers.', true, true, 'Remember', 'Observation', 'P0', '低'),
  ('VOC03', 'concept', 'Plant vocabulary', 'leaf', 'leaf', 'The green plant part that helps make food.', true, true, 'Remember', 'Observation', 'P0', '低'),
  ('DS01', 'process', 'Photosynthesis', 'photosynthesis sequence', 'photosynthesis sequence', 'Plants use sunlight, water, and carbon dioxide to make glucose and release oxygen.', true, true, 'Apply', 'Sequence', 'P0', '低'),
  ('EV01', 'evidence', 'Evidence', 'plant-process evidence', 'plant-process evidence', 'Use process evidence to explain cause and effect.', true, true, 'Evaluate', 'Evidence use', 'P0', '低')
on conflict (id) do update
set name = excluded.name,
    english_label = excluded.english_label,
    definition = excluded.definition,
    bloom_target = excluded.bloom_target,
    thinking_primary = excluded.thinking_primary;

insert into public.tasks (
  id,
  module,
  title,
  task_type,
  student_prompt,
  response_format,
  primary_node_ids,
  bloom,
  thinking_primary,
  difficulty,
  estimated_minutes,
  answer_key_or_rubric,
  student_safe_options,
  review_risk,
  copyright_status
)
values
  ('UI01', 'Plant vocabulary', 'Label the parts of a plant', 'Word-picture matching', 'Match each plant word to the diagram.', 'Select one label for each plant part.', array['VOC01','VOC02','VOC03'], 'Remember', 'Observation', '容易', 4, '{"labels":{"root":"root","stem":"stem","leaf":"leaf","seed":"seed"}}', '{"labels":["root","stem","leaf","seed"]}', '低', 'mock'),
  ('UI02', 'Photosynthesis', 'Classify photosynthesis inputs and outputs', 'Classification', 'Sort each card into Inputs, Outputs, or Helpers.', 'Choose one category for each term.', array['DS01'], 'Understand', 'Compare', '容易', 5, '{"classification":{"sunlight":"inputs","water":"inputs","carbonDioxide":"inputs","oxygen":"outputs","glucose":"outputs","chlorophyll":"helpers"}}', '{"terms":["sunlight","water","carbonDioxide","oxygen","glucose","chlorophyll"]}', '低', 'mock'),
  ('UI03', 'Photosynthesis', 'Build the photosynthesis process', 'Process sequencing', 'Put the photosynthesis events in the best order.', 'Tap the cards in sequence.', array['DS01'], 'Apply', 'Sequence', '中等', 6, '{"order":["water","carbon","sunlight","glucose","oxygen"]}', '{"steps":["water","carbon","sunlight","glucose","oxygen"]}', '低', 'mock'),
  ('UI08', 'Cause and effect', 'Find what changes when sunlight is missing', 'Multiple choice', 'Choose the 3 changes caused by missing sunlight.', 'Select all correct changes.', array['DS01'], 'Analyze', 'Cause and effect', '中等', 5, '{"correct":["glucose","oxygen","growth"],"penalize":["water"]}', '{"choices":["glucose","oxygen","growth","water"]}', '低', 'mock'),
  ('UI04', 'Evidence', 'Choose the best explanation', 'Explanation evaluation', 'Choose the strongest explanation and the reason.', 'Pick one explanation and one reason.', array['EV01'], 'Evaluate', 'Evidence use', '中等', 6, '{"explanation":"strong","reasons":["causeEffect","evidence"]}', '{"explanations":["strong","soil","green"],"reasons":["evidence","sequence","causeEffect","missingVocabulary"]}', '低', 'mock'),
  ('UI17', 'Speaking', 'Retell photosynthesis in your own words', 'Oral retelling', 'Record a short retelling of photosynthesis.', 'Simulated short audio recording.', array['DS01','EV01'], 'Create', 'Explain', '中等', 7, '{"rubric":"formative speaking feedback only"}', '{"maxSeconds":120,"languageHint":"en"}', '中', 'mock')
on conflict (id) do update
set title = excluded.title,
    student_prompt = excluded.student_prompt,
    response_format = excluded.response_format,
    answer_key_or_rubric = excluded.answer_key_or_rubric,
    student_safe_options = excluded.student_safe_options;

insert into public.task_annotations (id, task_id, knowledge_node_ids, bloom_requirement, thinking_requirement, evidence_locations, confidence, lint_status, status)
values
  ('ann_UI01', 'UI01', array['VOC01','VOC02','VOC03'], 'Remember', 'Observation', array['mock://task/UI01'], 0.900, 'INFO', 'APPROVED'),
  ('ann_UI02', 'UI02', array['DS01'], 'Understand', 'Compare', array['mock://task/UI02'], 0.900, 'INFO', 'APPROVED'),
  ('ann_UI03', 'UI03', array['DS01'], 'Apply', 'Sequence', array['mock://task/UI03'], 0.900, 'INFO', 'APPROVED'),
  ('ann_UI08', 'UI08', array['DS01'], 'Analyze', 'Cause and effect', array['mock://task/UI08'], 0.900, 'INFO', 'APPROVED'),
  ('ann_UI04', 'UI04', array['EV01'], 'Evaluate', 'Evidence use', array['mock://task/UI04'], 0.900, 'INFO', 'APPROVED'),
  ('ann_UI17', 'UI17', array['DS01','EV01'], 'Create', 'Explain', array['mock://task/UI17'], 0.850, 'WARN', 'APPROVED')
on conflict (id) do update set confidence = excluded.confidence, status = excluded.status;

insert into public.learning_paths (id, learner_id, source_path_id, status, goal, version, verifier_result, teacher_audit_explanation, published_at)
values (
  'PTH01',
  'stu_persona_a',
  'PTH01',
  'PUBLISHED',
  'Plant vocabulary and process foundation',
  1,
  '{"status":"PASS","verifier_version":"mock-verifier-v1","reasons":[]}',
  '{"student_text":"Ready path"}',
  now()
)
on conflict (id) do update
set status = excluded.status,
    goal = excluded.goal,
    version = excluded.version,
    verifier_result = excluded.verifier_result,
    teacher_audit_explanation = excluded.teacher_audit_explanation;

insert into public.learner_profiles (learner_id, class_id, active_path_id, safe_summary)
values ('stu_persona_a', 'class_104', 'PTH01', '{"focus":"Vocabulary foundation","evidenceCoverageLabel":"Some evidence"}')
on conflict (learner_id) do update
set class_id = excluded.class_id,
    active_path_id = excluded.active_path_id,
    safe_summary = excluded.safe_summary;

insert into public.path_steps (path_id, step_no, task_id, target_node_ids, minutes, rationale, status)
values
  ('PTH01', 1, 'UI01', array['VOC01','VOC02','VOC03'], 4, 'Focus: plant part words', 'AVAILABLE'),
  ('PTH01', 2, 'UI02', array['DS01'], 5, 'Focus: inputs and outputs', 'LOCKED'),
  ('PTH01', 3, 'UI03', array['DS01'], 6, 'Focus: process order', 'LOCKED'),
  ('PTH01', 4, 'UI08', array['DS01'], 5, 'Focus: cause and effect', 'LOCKED'),
  ('PTH01', 5, 'UI04', array['EV01'], 6, 'Focus: stronger evidence', 'LOCKED'),
  ('PTH01', 6, 'UI17', array['DS01','EV01'], 7, 'Focus: clear oral explanation', 'LOCKED')
on conflict (path_id, step_no) do update
set task_id = excluded.task_id,
    target_node_ids = excluded.target_node_ids,
    minutes = excluded.minutes,
    rationale = excluded.rationale,
    status = excluded.status;

insert into public.bkt_states (learner_id, node_id, mastery_probability, evidence_count, confidence, stability_label, parameter_version)
values
  ('stu_persona_a', 'VOC01', 0.52, 2, 'MEDIUM', 'TENTATIVE', 'mock-v1'),
  ('stu_persona_a', 'VOC02', 0.50, 2, 'MEDIUM', 'TENTATIVE', 'mock-v1'),
  ('stu_persona_a', 'VOC03', 0.55, 2, 'MEDIUM', 'TENTATIVE', 'mock-v1'),
  ('stu_persona_a', 'DS01', 0.45, 1, 'LOW', 'LOW_CONFIDENCE', 'mock-v1'),
  ('stu_persona_a', 'EV01', 0.40, 1, 'LOW', 'LOW_CONFIDENCE', 'mock-v1')
on conflict (learner_id, node_id) do update
set mastery_probability = excluded.mastery_probability,
    evidence_count = excluded.evidence_count,
    confidence = excluded.confidence,
    stability_label = excluded.stability_label;

insert into public.irt_states (learner_id, theta, standard_error, calibration_status, parameter_version)
values ('stu_persona_a', -0.2500, 0.8500, 'PILOT_TENTATIVE', 'mock-v1')
on conflict (learner_id) do update
set theta = excluded.theta,
    standard_error = excluded.standard_error,
    calibration_status = excluded.calibration_status;

insert into public.thinking_profiles (learner_id, observation_discrimination, induction_inference, critique_creation, evidence_coverage, rubric_version)
values ('stu_persona_a', 'T1', 'T0', 'EVIDENCE_INSUFFICIENT', 0.4200, 'mock-v1')
on conflict (learner_id) do update
set observation_discrimination = excluded.observation_discrimination,
    induction_inference = excluded.induction_inference,
    critique_creation = excluded.critique_creation,
    evidence_coverage = excluded.evidence_coverage;

insert into public.schema_versions (id, checksum, status, applied_by, applied_at)
values ('202606260001_initial_student_web_schema', 'mock-local-checksum', 'APPLIED', '00000000-0000-0000-0000-000000000401', now())
on conflict (id) do update
set checksum = excluded.checksum,
    status = excluded.status,
    applied_at = excluded.applied_at;

insert into public.tool_registry (
  id,
  tool_name,
  tool_type,
  version,
  owner,
  allowed_roles,
  allowed_workflows,
  input_schema,
  output_schema,
  secrets_required,
  audit_level,
  student_visible,
  retry_policy
)
values
  ('tool_task_search_v1', 'task_search', 'internal_api', 1, 'admin-worker', array['teacher','admin']::public.user_role[], array['recommend_path','path_verifier','generate_similar_practice'], '{}', '{}', '{}', 'payload_ref', false, '{"max_attempts":2}'),
  ('tool_rag_search_v1', 'rag_search', 'vector_db', 1, 'foundation-worker', array['teacher','curriculum_researcher','expert','admin']::public.user_role[], array['recommend_path','feedback_speaking','content_annotation','research_evidence','rag_answer_teacher'], '{}', '{}', '{}', 'payload_ref', false, '{"max_attempts":2}'),
  ('tool_rubric_lookup_v1', 'rubric_lookup', 'internal_api', 1, 'admin-worker', array['teacher','admin']::public.user_role[], array['grade_objective_task','feedback_speaking'], '{}', '{}', '{}', 'metadata', false, '{"max_attempts":1}'),
  ('tool_feedback_generator_v1', 'feedback_generator', 'openai_api', 1, 'worker', array['teacher','admin']::public.user_role[], array['feedback_speaking','generate_similar_practice'], '{}', '{}', array['OPENAI_API_KEY'], 'payload_ref', true, '{"max_attempts":2}'),
  ('tool_lms_adapter_v1', 'lms_adapter', 'lms_api_mock', 1, 'foundation-worker', array['teacher','admin']::public.user_role[], array['lms_sync'], '{}', '{}', array['LMS_CLIENT_ID','LMS_CLIENT_SECRET'], 'payload_ref', false, '{"max_attempts":3,"backoff":"exponential"}')
on conflict (id) do update
set allowed_roles = excluded.allowed_roles,
    allowed_workflows = excluded.allowed_workflows,
    audit_level = excluded.audit_level,
    student_visible = excluded.student_visible,
    retry_policy = excluded.retry_policy,
    updated_at = now();

insert into public.system_settings (key, value, updated_by)
values
  ('mock_data_retention_days', '{"days":7}', '00000000-0000-0000-0000-000000000401'),
  ('student_safe_projection_required', '{"enabled":true}', '00000000-0000-0000-0000-000000000401')
on conflict (key) do update
set value = excluded.value,
    updated_by = excluded.updated_by,
    updated_at = now();
