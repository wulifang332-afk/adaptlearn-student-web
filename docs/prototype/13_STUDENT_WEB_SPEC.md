# 13 Student Web Spec

## 1. 文档目的

本文定义 AdaptLearn Student Web 原型的产品规格。范围聚焦学生端 iOS 风格响应式 Web 原型，覆盖功能规格、非功能需求、数据实体/字段、状态流与业务流程、角色与权限。

本文区分当前 Phase 0 原型与生产化目标：Phase 0 使用 Unit 6 mock fixture 演示核心流程；生产化版本需要接入真实登录、真实权限后端、真实推荐算法、真实语音识别、真实批改和真实 LMS 同步。Phase 0 的学习效果、推荐、反馈均为可解释的演示数据，不可作为真实学生评价结论。

本文与 `15_ADMIN_WEB_PRODUCTION_SPEC.md` 和 `16_FOUNDATIONAL_CONSOLE_SPEC.md` 的边界保持一致：Student Web 不承载教师审核、内容治理、平台配置、RLS 测试、工具注册、队列管理或 CRUD 生成能力。Student Web 只消费后端生成的学生安全投影，所有教师/专家/管理员业务决策由 Admin Web 完成，所有平台基础配置和诊断由 Foundational Console 完成。

## 2. 产品范围

### 2.1 目标用户

- 学生：查看已发布学习路径，完成任务，查看反馈，进入相似练习，查看进度与画像。
- 英语教师：作为上游审核角色，负责发布、修改、拒绝或重规划学生可见学习路径。
- 课程研究员/专家/管理员：作为上游治理角色，负责内容、标注、ReviewCase、规则或系统状态，不直接操作学生端页面。

### 2.2 当前原型范围

- Unit 6: The Power of Plants。
- 学生 persona: `stu_persona_a`，基础词汇与植物过程路径 `PTH01`。
- 学习路径包含 6 个任务：`UI01`, `UI02`, `UI03`, `UI08`, `UI04`, `UI17`。
- 支持页面：Home、Path、Task、Progress、Profile。
- 支持相似练习：`SIM_UI01`, `SIM_UI02`, `SIM_UI03`, `SIM_UI04`。

### 2.3 生产化实现目标

- 要实现真实登录、真实权限后端、真实推荐算法、真实语音识别、真实批改、真实 LMS 同步。

### 2.4 非目标

- 不开放跨学生数据访问、班级排名、内部规则权重、教师审核记录或 ReviewCase 明细给学生。
- 不扩展到家长端、支付、多学科、自由聊天机器人或生产运营后台。
- 不实现 Admin Web 的内容、标注、诊断、路径审核、ReviewCase、规则、研究证据或 LMS 补偿页面。
- 不实现 Foundational Console 的组织/角色/RLS/Storage/RAG/Agent/Tool/Queue/Audit/Environment/CRUD 生成管理页面。

## 3. 功能规格说明

### 3.1 路由与导航

| 路由 | 页面 | 功能 |
|---|---|---|
| `/student` | Home | 学习首页，展示当前 Unit、路径完成度、今日任务入口 |
| `/student/path/:pathId` | Path | 学习路径详情，展示 6 个 Step 的顺序、状态、任务标签和 Start/Locked |
| `/student/tasks/:taskId` | Task | 任务作答页，支持提交、结果反馈、进入下一题 |
| `/student/tasks/:taskId/feedback` | Feedback | 规划中的反馈页；当前原型主要在 Task 内联展示结果 |
| `/student/progress` | Progress | 练习进度、错题/复习项、Retry 和 Practice Similar |
| `/student/profile` | Profile | 能力画像、思维技能、策略、徽章、班级入口 |

底部导航固定包含 Home、Path、Progress、Profile。Task 页面顶部显示返回路径、任务序号和 Exit。

### 3.2 Home

Home 用于让学生快速理解今天要学什么，并进入推荐任务。

功能要求：
- 展示品牌、学生名 `Xiaoming Zhang`、课程 `Grade 7 English`。
- 展示 Unit 6 标题、今日主题、截止时间、路径完成度、总时长和总步数。
- 展示 Today's Task 卡片，默认推荐当前第一个 `AVAILABLE` 或 `IN_PROGRESS` 任务。
- 点击 Start 进入对应 Task。
- 点击学习路径箭头或底部 Path 进入 Path。

验收标准：
- Home 首屏不需要说明文字即可识别当前任务和路径进度。
- 学生只能看到自己的有效路径和自己的推荐任务。
- 原型数据需清晰标注为 prototype/mock，不误导为真实模型结果。

### 3.3 Path

Path 用于解释学习路径顺序、任务目标和每一步状态。

功能要求：
- 展示 Unit 6 learning path 概览：任务总数、状态、目标标签。
- 按 Step 1 到 Step 6 展示路径时间线。
- 每个任务卡展示：Step、Bloom 层级、任务标题、任务类型、预计分钟数、知识点/能力标签、学生可读原因。
- `AVAILABLE` / `IN_PROGRESS` 任务按钮为 Start。
- `LOCKED` 任务按钮为 Locked 且不可进入。
- 完成某任务后，下一个任务解锁。

验收标准：
- 路径顺序稳定，完成 Step1 后 Step2 可直接从结果卡进入，不要求返回 Path。
- Locked 任务不可启动。
- 学生端不展示内部规则权重、教师审核详情、候选任务分数或不可解释排名。

### 3.4 Task

Task 是学生作答与提交的核心页面。

通用功能要求：
- 显示任务模块、任务类型、标题、prompt、Step、Bloom、预计时间、response format。
- 显示任务交互控件。
- 提交前允许作答、重置或选择提示。
- 提交后禁用提交按钮和已提交答案控件。
- 提交后显示结果卡，包含结果标题、简短反馈、正确答案/点评和下一步按钮。
- 如果存在下一个路径任务，显示 `Next task`；最后一题显示 `View progress`。

任务类型要求：

| Step | Task ID | 类型 | 当前交互 | 反馈逻辑 |
|---|---|---|---|---|
| 1 | `UI01` | Word-picture matching | 选择 root/stem/leaf/seed label | 显示 N of 4 correct，提交后 Submit 置灰，显示 Next task |
| 2 | `UI02` | Classification | 将 sunlight/water/carbon dioxide/oxygen/glucose/chlorophyll 分类 | 显示 N of 6 correct，提交后展示正确分类 |
| 3 | `UI03` | Process sequencing | 点击卡片构建 photosynthesis sequence | 显示 N of 5 correct |
| 4 | `UI08` | Cause/effect multiple choice | 选择缺少 sunlight 导致的 3 个变化 | 正确项为 glucose/oxygen/growth；多选错误项需扣分 |
| 5 | `UI04` | Explanation evaluation | 选一个 strongest explanation，再选理由 | 计 2 分：解释正确 + 理由正确 |
| 6 | `UI17` | Oral retelling | 模拟 Hold to speak / Finish recording | 不显示 `1 of 1 correct`，显示口语点评 |

验收标准：
- Objective task 提交后不能重复点击 Check/Submit。
- 每个 task 提交后都有明确的继续动作。
- Speaking task 的反馈应是口语表现点评，不用正确/错误计分表达。
- Task 4 的多选题必须把错误选择纳入评分，不能选四项仍显示满分。

### 3.5 Progress

Progress 用于呈现学生近期练习、复习项和相似练习入口。

功能要求：
- 展示积分/credits、路径完成度和 Review Notebook。
- Review item 展示 focus、last result、Retry、Practice Similar。
- `Retry` 进入原任务。
- `Practice Similar` 进入对应相似题，而不是原题。
- 支持反思区：输入 reflection、选择 Easy/Just right/Hard、Submit 后显示提交确认。

验收标准：
- Practice Similar 的目标 task id 必须以 `SIM_` 开头。
- Similar task 的标题、prompt、图示或题型必须不同于原题，且练习相同能力。
- Progress 不展示班级排名或其他学生数据。

### 3.6 Similar Practice

Similar Practice 用于针对错题/薄弱项进行同能力新题练习。

功能要求：
- `SIM_UI01`: 用新植物图匹配 leaf/flower/seed。
- `SIM_UI02`: 将 plant daytime exchange 分类为 Taken in / Given out / Not used here。
- `SIM_UI03`: 排序 sunlight -> glucose -> oxygen 的简化过程。
- `SIM_UI04`: 选择使用 plant-process evidence 的更强解释。
- Similar task 提交后反馈类型为 practice，不显示标准任务正确率。

验收标准：
- Similar Practice 不能仅复制原题描述。
- Similar Practice 必须可交互作答。
- Similar Practice 提交后不应修改原路径 step 解锁状态。

### 3.7 Profile

Profile 用于展示学生安全可见的学习画像。

功能要求：
- 展示 profile hero、Ability Profile、Thinking Skills、Learning Strategies、My Badges、My Class。
- Ability Profile 展示 Strong / Growing / Needs Practice 等可读标签。
- Thinking Skills 展示观察、推理、批判/创造等维度，不合并成一个总分。
- My Class 展示班级名、组名、周目标和 Enter Group Chat。

验收标准：
- 学生画像只展示安全摘要，不显示 BKT 概率、IRT theta、标准误、内部证据明细或排名。
- Enter Group Chat 按钮文案在移动宽度下不应断裂或远离图标。

## 4. 非功能需求

### 4.1 性能

- 首屏渲染目标：本地原型环境下 2 秒内出现 Home 主内容。
- 交互响应目标：按钮点击、选项选择、路由切换在 200ms 内反馈 UI 状态。
- 滚动体验：手机壳内部 `.screen-scroll` 滚动应流畅，无明显布局跳动。
- 资源体积：Phase 0 不引入大型媒体或真实音频文件；生产化音频/图片/视频通过 Supabase Storage 管理，前端只加载当前任务所需资源。
- 测试要求：核心交互需覆盖 Home -> Task -> Submit -> Next、Progress -> Practice Similar、Profile 渲染。

### 4.2 安全与隐私

- 学生只能访问自己的有效已发布路径。
- 学生不可看到其他学生数据、教师审核记录、ReviewCase 明细、内部规则权重、精确排名。
- Mock 数据不得包含真实姓名、真实学生 ID、真实提交或真实音频。
- 所有提交必须携带 `path_id`、`path_version`、`task_id` 和 idempotency key，防止重复提交污染状态。
- 高风险写作/口语类输出在生产设计中必须支持 teacher review / ReviewCase，不应直接作为真实评分结论。

### 4.3 可用性

- 主要操作按钮最小高度不低于 42px，紧凑按钮不低于 34px。
- 任务完成后必须给出下一步 CTA，避免学生返回路径主页找下一题。
- 文案面向七年级学生，避免内部术语和不可靠精确数值。
- 错题相似练习必须可直接进入可作答页面。
- 所有页面在 390px 到 500px 宽手机壳下不可出现文本重叠、按钮文案截断或导航遮挡内容。

### 4.4 可访问性

- 关键页面区域、导航、表单控件、按钮需要有清晰语义或可读文本。
- 图示题需提供文本 prompt 和可读 label，不能只依赖视觉识别。
- 状态变化需通过可见文本表达，例如 submitted、review pending、queued sync。
- 颜色不能作为唯一状态表达；Locked/Completed/Selected 等应有文字或图标辅助。

### 4.5 可靠性与离线

- Phase 0 使用 in-memory mock，不保证刷新后保留临时提交状态。
- 生产化设计需支持 offline ready、queued sync、retry、version stale、permission revoked 等状态。
- 重复提交应通过 idempotency key 去重。
- 任务版本过期或路径取消时，应阻止继续作答并提示刷新/返回。

### 4.6 可维护性

- 数据契约以 `prototype/shared/src/schemas/core.ts` 为准。
- 页面路由与学生端 view model 以 `prototype/student-web/src/lib/adaptlearn.ts` 为准。
- 任务交互组件应保持按 task id 分支，避免把多种题型耦合成不可维护的大函数。
- 新增任务类型时，需要同步：数据 fixture、view model、task interaction、测试和本 spec。

## 5. 数据需求：实体与字段

### 5.0 数据边界与学生安全投影

生产化 Student Web 不直接查询 canonical Admin/Foundation 表。前端通过 FastAPI 或受控 view 读取以下学生安全投影：

| Projection | 来源 | 学生端允许字段 |
|---|---|---|
| `student_home_view` | `students`, `learning_paths`, `path_steps` | student display label、active unit、path title、progress count、next task summary、safe sync badge |
| `student_learning_path_view` | `learning_paths`, `path_steps`, `tasks`, `teacher_audit_explanation` | path id/version、goal、step order、task title/type/minutes、status、`student_text`、safe reason chips |
| `student_task_view` | `tasks`, `path_steps`, approved annotations | prompt、response format、media refs、safe node labels、Bloom/thinking display labels、allowed hints |
| `student_feedback_view` | `student_submissions`, feedback artifacts | submission status、safe formative feedback、review pending flag、next action |
| `student_profile_summary_view` | `learner_profiles`, BKT/IRT/Bloom/thinking tables | Strong/Growing/Needs Practice、evidence sufficiency、thinking dimensions、strategy labels |
| `student_upload_status_view` | `media_uploads` | upload status、retry state、review pending flag |

Student Web 永远不展示或持久化以下字段：

- `rule_evaluation.component_scores`、内部 rule weights、候选任务排序分数。
- `teacher_audit_explanation.teacher_text`、`rule_refs`、`excluded_task_refs`。
- `decision_traces`、ReviewCase reason codes、owner、decision notes 或 source snapshots。
- 原始 BKT 概率、IRT theta、standard error、calibration internals。
- 原始 annotation confidence、lint notes、expert deliberation。
- 其他学生数据、精确排名、admin/support audit logs。
- `answer_key_or_rubric`，除非后端已经生成安全反馈并允许展示对应点评。

### 5.1 源数据规模

| 数据源 | 当前规模 |
|---|---|
| Knowledge nodes | 128 |
| Knowledge edges | 669 |
| Tasks | 91 |
| Sample path rows | 36 |
| 当前学生路径任务 | 6 |

### 5.2 核心业务实体

| 实体 | 主键 | 关键字段 | 用途 | 约束 |
|---|---|---|---|---|
| `User` | `user_id` | `role`, `display_name`, `organization_id`, `class_ids` | staff/student 角色和组织归属 | role 必须来自枚举 |
| `Student` | `student_id` | `class_id`, `pseudonymous_label`, `persona_id` | 学生身份和 persona 绑定 | 学生端不得暴露真实身份 |
| `Class` | `class_id` | `organization_id`, `grade`, `subject`, `teacher_user_ids`, `student_ids` | 班级和教师权限边界 | 教师只能访问 assigned class |
| `LearnerProfile` | `learner_id` | `active_path_id`, `bkt_states`, `irt_state`, `bloom_profile`, `thinking_profile` | 构建学生安全画像和进度摘要 | 学生端只能展示摘要，不展示内部数值 |
| `KnowledgeNode` | `node_id` | `name`, `definition`, `bkt_eligible`, `irt_eligible`, `bloom_target`, `thinking_primary`, `review_risk` | 任务目标和能力维度 | 必须来自 Unit 6 baseline |
| `Task` | `task_id` | `title`, `task_type`, `student_prompt`, `response_format`, `primary_node_ids`, `bloom`, `thinking_primary`, `estimated_minutes`, `answer_key_or_rubric` | 任务内容与交互类型 | 学生端只显示安全字段 |
| `TaskAnnotation` | `annotation_id` | `task_id`, `knowledge_node_ids`, `bloom_requirement`, `thinking_requirement`, `confidence`, `lint_status`, `status` | 内容标注和治理 | LLM 不可直接创建正式标签 |
| `TaxonomyVersion` | `taxonomy_version_id` | `status`, `published_at`, `compatibility_mappings` | 知识图谱版本快照 | 学生端显示路径/任务版本绑定的安全 label，不读取 live mutable node label |
| `ContentVersion` / `UnitPackage` | `content_version_id` / `package_id` | `status`, `version`, `source_ref`, `copyright_status` | Admin Web 内容与任务包治理 | 学生端不直接读取；只通过已发布任务安全投影间接消费 |
| `LearningPath` | `path_id` | `learner_id`, `source_path_id`, `status`, `goal`, `version`, `steps`, `verifier_result`, `teacher_audit_explanation` | 学生路径 | 学生只能读自己 `PUBLISHED` / 有效 `IN_PROGRESS` 且 deliverability guard 通过的路径 |
| `PathStep` | `step_no` + `task_id` | `target_node_ids`, `minutes`, `rationale`, `status` | 路径任务顺序和解锁状态 | 状态来自 `LOCKED/AVAILABLE/IN_PROGRESS/COMPLETED/REVIEW_PENDING/WITHDRAWN` |
| `StudentSubmission` | `submission_id` | `learner_id`, `task_id`, `path_id`, `path_version`, `status`, `response_payload_ref`, `evidence_ids`, `idempotency_key` | 学生提交 | Data Lint 通过前不得更新学习状态 |
| `MediaUpload` | `media_upload_id` | `submission_id`, `media_type`, `status`, `duration_seconds`, `resume_token` | 口语/音视频上传 | 录音上限 120 秒 |
| `ReviewCase` | `review_case_id` | `object_type`, `object_id`, `severity`, `risk_level`, `owner_user_id`, `status`, `reason_codes` | REVIEW/BLOCK 人工处理 | REVIEW/BLOCK 必须显式建 case |
| `DecisionTrace` | `trace_id` | `actor_user_id`, `action`, `reason_required`, `reason_text`, `before_snapshot_ref`, `after_snapshot_ref`, `created_at` | 教师/系统决策审计 | Override 或 required reason 必须写原因 |

### 5.3 学生端 View Model

| View model | 字段 | 来源 |
|---|---|---|
| `RouteState` | `home`, `path`, `task`, `feedback`, `growth`, `profile` | URL parser |
| `SafeTaskCard` | `stepNo`, `taskId`, `title`, `module`, `taskType`, `prompt`, `responseFormat`, `bloom`, `thinking`, `difficulty`, `minutes`, `status`, `isActionable`, `nodeNames`, `studentReason`, `riskLabel` | `Task` + `PathStep` + safe translation |
| `SafeProgressSummary` | `knowledge`, `bloom`, `strategies`, `thinking`, `evidenceCoverageLabel` | `LearnerProfile` safe projection |
| `StudentProfileSummary` | `identity`, `credits`, `reviewItems`, `accuracy`, `abilities`, `thinkingSkills`, `strategies`, `badges`, `classInfo` | `LearnerProfile` + submissions + current task cards |
| `LastFeedback` | `taskId`, `title`, `submissionStatus`, `feedbackKind`, `correctCount`, `totalCount`, `resultText`, `summary`, `detail` | local mock submit snapshot |

### 5.4 数据校验规则

- `LearningPath.status = PUBLISHED` 时，`verifier_result.status` 必须为 `PASS` 且不可有 blocking review state。
- 学生读取路径时必须满足 deliverability guard：当前版本、属于自己、`status in ('PUBLISHED', 'IN_PROGRESS')`、Verifier `PASS`、无 REVIEW/BLOCK lint、无 unresolved blocking ReviewCase。
- `PathStep.status` 控制学生可进入性：只有 `AVAILABLE` 和 `IN_PROGRESS` 可启动。
- `StudentSubmission` 必须携带 `learner_id`、`path_id`、`path_version`、`task_id` 和 `idempotency_key`；`path_version` 必须等于学生当前已发布路径版本。
- `StudentSubmission` 或 `MediaUpload` 进入 REVIEW 时，Student Web 只显示 review pending / upload issue，不显示 ReviewCase 明细。
- Data/Output Lint 通过前，学生提交不得更新 learner profile canonical state。
- `MediaUpload.duration_seconds` 不得超过 120。
- `DecisionTrace.reason_text` 在 `OVERRIDE` 或 `reason_required = true` 时必填。
- Similar Practice task id 必须以 `SIM_` 开头，并保留 source task id 映射。
- LMS sync 与 AdaptLearn publish 独立；LMS 失败不能让未发布路径对学生可见，也不能隐藏 AdaptLearn 内部已发布且 deliverable 的路径。

## 6. 状态流与业务流程

### 6.1 Path Step 状态流

```text
LOCKED -> AVAILABLE -> IN_PROGRESS -> COMPLETED
                         |
                         -> REVIEW_PENDING
```

规则：
- 初始只有 Step1 为 `AVAILABLE`，其他任务为 `LOCKED`。
- 学生提交并完成当前 task 后，当前 step 变为 `COMPLETED`，下一个 step 变为 `AVAILABLE`。
- Speaking/writing 等高风险任务在生产设计中可进入 `REVIEW_PENDING`。
- `WITHDRAWN` 或路径 stale 时，学生端不可继续作答。

### 6.2 Student Task 提交流程

```text
Open task
  -> answer / record / select
  -> submit
  -> create StudentSubmission
  -> Data/Output Lint
  -> score or speaking/practice feedback
  -> disable submitted controls
  -> Next task / View progress
```

关键规则：
- Objective task 可立即展示正确答案或正确率。
- Speaking task 展示口语点评，不用 `N of N correct`。
- Similar Practice 提交为 practice feedback，不影响主路径解锁。
- 重复点击提交按钮必须被禁用或幂等处理。

### 6.3 Home 到 Path 到 Task 主流程

```text
Student opens /student
  -> API resolves student_home_view
  -> sees current own published/deliverable path
  -> opens Path
  -> starts first available task
  -> submits answer
  -> result card appears
  -> taps Next task
  -> lands on next unlocked task
```

业务要求：
- 学生完成任务后不应被迫回到 Path 才能继续。
- 若没有 valid published/deliverable path，Home 应显示 empty/unavailable 状态。
- 若路径版本 stale，Task 应提示刷新或返回。
- 若路径被 withdrawn、blocked、cancelled 或 projection stale，Student Web 显示 unavailable / version stale / review pending 安全状态，不显示内部原因。

### 6.4 Progress 到 Similar Practice 流程

```text
Open Progress
  -> inspect Review Notebook
  -> tap Practice Similar
  -> navigate to SIM_<sourceTaskId>
  -> answer similar task
  -> submit practice feedback
```

业务要求：
- Retry 进入原题。
- Practice Similar 进入相似题。
- 相似题需改换情境/素材/题干，但保持同一能力目标。

### 6.5 Profile 流程

```text
Open Profile
  -> view ability summary
  -> view thinking skills
  -> view learning strategies
  -> view badges
  -> view class card
```

业务要求：
- Profile 只展示学生安全摘要。
- 不展示精确模型参数、排名、教师内部记录或他人信息。

### 6.6 Review/Block 上游流程

```text
Lint / Verifier emits REVIEW or BLOCK
  -> create ReviewCase
  -> assign scoped owner
  -> inspect source object
  -> approve / request fix / reject / block
  -> write DecisionTrace
  -> source flow resumes or remains blocked
```

业务要求：
- `BLOCK` 不能被发布、推荐或更新绕过。
- 教师修改/拒绝/重规划路径必须写 reason，并产生 `DecisionTrace`。
- Student Web 只接收 review pending / unavailable / version stale 等安全状态，不读取 ReviewCase 或 DecisionTrace。

### 6.7 Teacher Publish 到 Student Read 流程

```text
Teacher opens current LearningPath version in Admin Web
  -> API checks assigned class scope and path current version
  -> API checks tasks/content/annotations are approved and not blocked
  -> API checks Path Lint, Verifier PASS, and no unresolved blocking ReviewCase
  -> teacher action writes DecisionTrace
  -> path status becomes PUBLISHED
  -> student-safe projection is generated or invalidated for regeneration
  -> LMS sync job is enqueued
  -> Student Web reads projection after deliverability guard passes
```

业务要求：
- `teacher_audit_explanation.student_text` 是唯一可进入 Student Web 的路径解释字段。
- 手动修改路径必须创建新版本；学生提交的 `path_version` 必须匹配当前已发布版本。
- `MODIFY`、`REJECT`、`REPLAN` 必须有教师 reason；Student Web 不能展示该 reason 或 DecisionTrace。
- 如果 Admin Web 或 Foundational Console 发现 schema/RLS/storage/RAG/queue/tool 问题，Student Web 只显示安全降级状态。

## 7. 角色与权限定义

| 角色 | 学生端权限 | 上游权限 | 禁止项 |
|---|---|---|---|
| Student | 读取自己的已发布路径；完成自己的任务；查看自己的安全反馈、进度、画像 | 无 | 访问其他学生数据；查看内部规则权重、教师审核记录、ReviewCase 明细、精确排名 |
| English teacher | 无直接学生端操作；可通过上游发布学生可见路径 | 查看 assigned class 诊断；审核/修改/拒绝/重规划路径；处理 scoped ReviewCase | 静默 override；跨班级访问；无 reason 修改路径 |
| Curriculum researcher | 无直接学生端操作 | 在 Admin Web 创建/编辑/归档/审核内容、任务、知识图谱、标注、研究证据和 governed RAG source usage | 代替教师做最终学生路径决策；浏览 unrestricted student submissions |
| Expert | 无直接学生端操作 | 在 Admin Web 审核高风险标注、taxonomy change、研究证据或专家 case | 直接发布学生路径；访问无关学生数据；覆盖教师决策 |
| System admin | 无直接学生端操作 | Admin Web 中分配/监控 ReviewCase、规则发布/回滚、LMS dead-letter；Foundational Console 中管理组织/角色/RLS/工具/队列/环境/CRUD | 静默覆盖教师或专家结论；直接修改 learner state |
| Foundational Console | 无学生端 UI 权限 | 管理平台基础：tenant、role assignment、RLS test runner、storage、RAG index、agent/tool registry、queue、audit、environment、generated CRUD | 替代 Admin Web 业务结论；直接让 blocked/review 对象进入 Student Web |
| LMS | 无 UI 权限 | 生产设计中的外部同步 actor；Phase 0 仅静态状态 | 主动读取 UI 数据或修改学生端状态 |

权限守卫：
- `studentsCanAccessOnlyOwnData = true`
- `teacherOverrideRequiresReasonAndDecisionTrace = true`
- `reviewMustCreateReviewCase = true`
- `blockCannotPublishRecommendOrUpdate = true`
- `phase0MockModeMustBeClearlyLabeled = true`
- `productionRequiresRealAuthPermissionRecommendationSpeechGradingLms = true`
- `studentReadsOnlySafeProjection = true`
- `adminBusinessDecisionsStayInAdminWeb = true`
- `foundationCannotBypassTeacherExpertDecisions = true`

## 8. 验收清单

- Home 能展示当前学生名、Unit 6、路径进度和 Today's Task。
- Path 能展示 6 个 step，锁定状态和开始按钮正确。
- Step1 提交后 Submit 置灰，显示结果和 `Next task`。
- Step2 到 Step6 提交后同样禁用 Check/Submit，并提供下一步 CTA。
- Task4 选择错误项时不能满分。
- Task6 口语题展示 speaking feedback，不展示 `1 of 1 correct`。
- Progress 中 `Retry` 进入原题，`Practice Similar` 进入 `SIM_` 相似题。
- Profile 中 My Class 的 Enter Group Chat 文案不换行错位。
- 学生端任何页面都不展示内部规则权重、教师审核记录、DecisionTrace、ReviewCase 明细、expert deliberation、raw BKT/IRT 数值或其他学生数据。
- StudentSubmission 请求包含 `learner_id`、`path_id`、`path_version`、`task_id`、`idempotency_key`。
- 无 valid published/deliverable path、version stale、review pending、queued sync、offline unavailable 都有学生安全状态。
- Similar Practice 提交不改变主路径 unlock 状态，不写入路径完成度。
- LMS sync failure 不影响 AdaptLearn 内已发布 deliverable path 的学生读取。
- Mock 数据、反馈和画像不被描述为真实模型或真实学习效果。

## 9. 关联文件

- Source of truth: `docs/prototype/00_SOURCE_OF_TRUTH.md`
- Prototype brief: `docs/prototype/01_PROTOTYPE_BRIEF.md`
- Screen inventory: `docs/prototype/03_SCREEN_INVENTORY.md`
- Route map: `docs/prototype/04_ROUTE_MAP.md`
- Flow index: `docs/prototype/05_FLOW_INDEX.md`
- State matrix: `docs/prototype/06_STATE_MATRIX.md`
- Role permission matrix: `docs/prototype/08_ROLE_PERMISSION_MATRIX.md`
- Mock data contract: `docs/prototype/09_MOCK_DATA_CONTRACT.md`
- Production implementation spec: `docs/prototype/14_PRODUCTION_IMPLEMENTATION_SPEC.md`
- Admin production spec: `docs/prototype/15_ADMIN_WEB_PRODUCTION_SPEC.md`
- Foundational Console spec: `docs/prototype/16_FOUNDATIONAL_CONSOLE_SPEC.md`
- Shared schemas: `prototype/shared/src/schemas/core.ts`
- Student view model: `prototype/student-web/src/lib/adaptlearn.ts`
- Student app UI: `prototype/student-web/src/App.tsx`
