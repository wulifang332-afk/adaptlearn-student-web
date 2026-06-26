import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "deliverables", "competition-html");

const studentTasks = [
  {
    id: "UI01",
    step: 1,
    title: "Label the parts of a plant",
    type: "Word-picture matching",
    bloom: "Remember",
    minutes: 4,
    nodes: ["Root", "Stem", "Leaf", "Seed"],
    prompt: "Match the plant words to the correct parts. This task uses safe labels only.",
  },
  {
    id: "UI02",
    step: 2,
    title: "Classify photosynthesis inputs and outputs",
    type: "Classification",
    bloom: "Understand",
    minutes: 5,
    nodes: ["Sunlight", "Water", "Carbon dioxide", "Oxygen"],
    prompt: "Sort each idea into input or output. Internal rubrics stay hidden from students.",
  },
  {
    id: "UI03",
    step: 3,
    title: "Build the photosynthesis process",
    type: "Process sequencing",
    bloom: "Analyze",
    minutes: 6,
    nodes: ["Photosynthesis sequence", "Glucose", "Oxygen"],
    prompt: "Put the process in order after finishing the first two tasks.",
  },
];

const adminQueue = [
  ["Learning path blocked", "Xiaoming Zhang - Unit 6 plant process path", "REVIEW", "Lina Chen", "Today 17:00"],
  ["High-risk annotation", "Oral retelling rubric alignment", "BLOCK", "Maya Singh", "Tomorrow 09:00"],
  ["LMS sync dead letter", "Grade 7 English A publish retry", "REVIEW", "Noah Patel", "Today 14:00"],
  ["Content source issue", "Daylight and plant growth reading", "REVIEW", "Hao Lin", "Jun 28"],
];

const adminTasks = [
  ["UI01", "Label the parts of a plant", "Word-picture matching", "Remember", "APPROVED"],
  ["UI02", "Classify photosynthesis inputs and outputs", "Classification", "Understand", "APPROVED"],
  ["UI03", "Build the photosynthesis process", "Process sequencing", "Analyze", "APPROVED"],
  ["UI17", "Oral retelling of photosynthesis", "Speaking", "Apply", "BLOCKED"],
];

const consoleSections = [
  {
    id: "overview",
    label: "System Overview",
    metrics: [
      ["Mode", "Mock/dev", "Prototype data only; no real minors."],
      ["Region", "ap-northeast-1", "Supabase project region label."],
      ["Storage", "4 private buckets", "student-media, rag-source-docs, generated-feedback, prototype-exports."],
      ["Retention", "7 days", "Mock artifacts and logs expire unless exported."],
    ],
    resources: [
      ["Supabase foundation", "MOCK", "Project URL and region known; secrets remain backend-only."],
      ["RAG corpus foundation", "WARN", "Sources registered; embeddings are mocked for offline demo."],
      ["Agent workflow observability", "MOCK", "Workflow registry shows guardrail contracts."],
      ["Audit and trace coverage", "PASS", "Trace, audit, job, agent, and tool ids are shown as metadata."],
    ],
  },
  {
    id: "storage",
    label: "Storage Bucket Manager",
    metrics: [
      ["Buckets", "4 private", "No public raw student media exposure."],
      ["Signed URLs", "Required", "Short-lived and audit-covered."],
      ["Cleanup", "7-day mock", "Generated feedback and task media retention."],
    ],
    resources: [
      ["student-media", "PASS", "Audio/image/video task uploads; signed access only."],
      ["rag-source-docs", "PASS", "Textbook, task bank, graph, and teacher rule documents."],
      ["generated-feedback", "WARN", "Safe generated feedback artifacts; cleanup job expected."],
      ["prototype-exports", "PASS", "Private export area for demo artifacts."],
    ],
  },
  {
    id: "rag",
    label: "RAG Source / Vector Registry",
    metrics: [
      ["Sources", "4 classes", "Textbook, task bank, knowledge graph, teacher rules."],
      ["Embedding", "1024 dims", "text-embedding-3-large contract."],
      ["Citations", "Required", "Student answers get source ids, not raw chunks."],
    ],
    resources: [
      ["Textbook source class", "MOCK", "Registered metadata; raw text remains internal."],
      ["Task bank source class", "MOCK", "Answer keys and rubrics never go to Student Web."],
      ["Citation-safe retrieval", "PASS", "Results include citation ids and safe summaries."],
    ],
  },
  {
    id: "agents",
    label: "Agent / Tool / Job Monitor",
    metrics: [
      ["Agent model", "gpt-5.5 plan", "Backend-only binding."],
      ["Redis queue", "Configured", "Celery/Redis-ready skeleton; offline demo uses mock state."],
      ["External calls", "Audited", "Every tool call links trace and audit metadata."],
    ],
    resources: [
      ["recommend_path", "WARN", "Creates teacher-reviewable candidates by default."],
      ["grade_objective_task", "MOCK", "Deterministic checker first; model only when useful."],
      ["transcribe_speaking", "NOT_CONFIGURED", "Requires backend OpenAI key and worker queue."],
      ["audit_log_writer", "PASS", "Trusted server path only; no browser service role."],
    ],
  },
  {
    id: "lms",
    label: "LMS Connector Settings",
    metrics: [
      ["Adapter", "MockLmsAdapter", "OAuth shape preserved for real vendor later."],
      ["Scopes", "5 planned", "classes, assignments, submissions, grades, users."],
      ["Webhook", "Mock secret", "Demo-only signing placeholder."],
    ],
    resources: [
      ["Class roster sync", "MOCK", "Demo-only class/student mapping."],
      ["Path publish sync", "WARN", "LMS status cannot publish an unpublished AdaptLearn path."],
      ["Feedback summary sync", "MOCK", "Safe summary only; no hidden rubric evidence."],
    ],
  },
  {
    id: "environment",
    label: "Environment & Secrets Checklist",
    metrics: [
      ["Supabase", "Server-only keys", "Publishable key can be frontend; service role never can."],
      ["OpenAI", "Backend-only", "Mock adapter active without live calls in this file."],
      ["Redis", "Backend-only", "Queue broker URL never enters browser pages."],
    ],
    resources: [
      ["NEXT_PUBLIC_SUPABASE_URL", "PASS", "Browser-safe URL only."],
      ["SUPABASE_SECRET_KEY", "PASS", "Backend/deploy secret only; value excluded."],
      ["OPENAI_API_KEY", "PASS", "Backend-only adapter binding; value excluded."],
      ["REDIS_URL", "PASS", "Backend-only queue broker; value excluded."],
      ["LMS_CLIENT_SECRET", "MOCK", "MockLmsAdapter placeholder; value excluded."],
    ],
  },
];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function pageShell({ title, description, body, style, script = "" }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <style>${style}</style>
</head>
<body>
${body}
${script ? `<script>${script}</script>` : ""}
</body>
</html>
`;
}

function statusClass(status) {
  return status.toLowerCase().replaceAll("_", "-");
}

function commonStatusStyles() {
  return `
.status{display:inline-flex;align-items:center;min-height:24px;border:1px solid #cfd8e3;border-radius:999px;padding:3px 9px;font-size:12px;font-weight:850;white-space:nowrap}
.status.pass,.status.approved,.status.published{border-color:#b8ddc8;background:#edf9f2;color:#1d6b4b}
.status.warn,.status.review,.status.teacher-review{border-color:#edd5a2;background:#fff6df;color:#895a0f}
.status.block,.status.blocked{border-color:#efc5bf;background:#fff0ec;color:#a33225}
.status.mock,.status.not-configured{border-color:#d3dbe6;background:#f3f6fa;color:#536274}
`;
}

function studentHtml() {
  const taskCards = studentTasks
    .map(
      (task, index) => `<article class="path-task ${index === 0 ? "active" : index === 1 ? "" : "locked"}">
        <span class="marker">${index + 1}</span>
        <div>
          <div class="row"><strong>${escapeHtml(task.title)}</strong><span class="pill">${escapeHtml(task.bloom)}</span></div>
          <p>${escapeHtml(task.type)} · ${task.minutes} min · ${task.nodes.map(escapeHtml).join(", ")}</p>
        </div>
      </article>`,
    )
    .join("");

  return pageShell({
    title: "AdaptLearn Student Web - Competition HTML",
    description: "Offline Student Web demo for judges.",
    style: `
:root{--surface:#f4f7f1;--card:#fff;--soft:#eef6f2;--text:#17342f;--muted:#66756f;--border:#d9e2dc;--accent:#16845f;--accent-dark:#0f644d;--sky:#2f7fb8;--amber:#c88924;--shadow:0 18px 48px rgba(19,52,47,.14);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--text);background:var(--surface)}
*{box-sizing:border-box}body{margin:0;min-width:320px;background:linear-gradient(130deg,rgba(47,127,184,.12),transparent 30%),linear-gradient(320deg,rgba(200,137,36,.16),transparent 28%),var(--surface)}button{font:inherit;cursor:pointer}.wrap{min-height:100vh;display:grid;place-items:center;padding:28px}.phone{width:min(100%,430px);min-height:760px;max-height:920px;display:grid;grid-template-rows:auto 1fr auto;overflow:hidden;border:1px solid rgba(23,52,47,.18);border-radius:34px;background:#fff;box-shadow:var(--shadow)}.chrome{border-bottom:1px solid var(--border);background:rgba(255,255,255,.94)}.statusbar{height:32px;display:flex;align-items:center;justify-content:space-between;padding:0 24px;font-weight:800;font-size:13px}.header{min-height:72px;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 18px 16px}.brand{display:flex;align-items:center;gap:10px}.logo{width:36px;height:36px;display:grid;place-items:center;border-radius:50%;background:#eef8ee;color:var(--accent);font-weight:900}.brand strong{display:block;color:var(--accent-dark)}.brand small,.muted{color:var(--muted);font-size:13px}.scroll{min-height:0;overflow:auto;padding:16px}.screen{display:none;gap:14px;padding-bottom:12px}.screen.active{display:grid}.panel{border:1px solid var(--border);border-radius:8px;background:#fff;box-shadow:0 1px 2px rgba(23,52,47,.06);padding:16px}.hero{display:grid;grid-template-columns:1fr 136px;align-items:center;min-height:158px;background:linear-gradient(120deg,#fff 0%,#f5fbf2 58%,#eaf5ed 100%)}h1,h2,p{margin:0}h1{font-size:32px;line-height:1.06;color:#123d35}.eyebrow{color:var(--accent-dark);font-size:12px;font-weight:900;text-transform:uppercase}.unit{display:inline-flex;margin-top:8px;border-radius:999px;background:#e5f3ef;color:var(--accent-dark);padding:4px 10px;font-size:12px;font-weight:900}.plant{width:124px;height:124px;border-radius:22px;background:radial-gradient(circle at 50% 82%,#b98b4e 0 12%,transparent 13%),linear-gradient(#2f9b6d,#2f9b6d) 50% 58%/8px 52px no-repeat}.plant:before,.plant:after{content:"";display:block;position:relative;width:58px;height:38px;border-radius:60% 40% 60% 40%;background:#75bd68}.plant:before{left:28px;top:28px;transform:rotate(-30deg)}.plant:after{left:56px;top:22px;transform:rotate(25deg)}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.summary strong{display:block;margin-top:4px}.row{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.progress{height:10px;overflow:hidden;border-radius:999px;background:#e6ece8;margin:14px 0}.progress span{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--accent),#7dbb4f)}.chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}.chip,.pill{display:inline-flex;align-items:center;border:1px solid var(--border);border-radius:999px;background:#fbfcf8;padding:5px 9px;font-size:12px;font-weight:800;color:#52635e}.pill{background:#eaf5ef;color:var(--accent-dark)}.primary,.secondary{min-height:42px;display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:999px;border:1px solid var(--accent);background:var(--accent);color:#fff;padding:9px 16px;font-weight:850}.secondary{background:#fff;color:var(--accent-dark);border-color:var(--border)}.task-feature{display:grid;gap:12px}.path-task{display:grid;grid-template-columns:38px 1fr;gap:10px;border:1px solid var(--border);border-radius:8px;padding:12px;background:#fff}.path-task.locked{opacity:.62}.marker{width:32px;height:32px;display:grid;place-items:center;border-radius:50%;background:#eaf5ef;color:var(--accent-dark);font-weight:900}.answer-grid{display:grid;gap:8px}.choice{border:1px solid var(--border);border-radius:8px;background:#fbfcf8;padding:10px;text-align:left}.choice.selected{border-color:var(--accent);background:#e9f7ef}.feedback{border-left:4px solid var(--accent);background:#f2faf5}.bottom{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:10px 14px 16px;border-top:1px solid var(--border);background:#fff}.bottom button{border:0;background:transparent;color:#60736b;font-weight:850;padding:8px;border-radius:8px}.bottom button.active{background:#eaf5ef;color:var(--accent-dark)}.notice{font-size:12px;color:var(--muted);line-height:1.35}@media(max-width:520px){.wrap{padding:0}.phone{min-height:100vh;border-radius:0;border:0}.hero{grid-template-columns:1fr}.plant{display:none}}
`,
    body: `<div class="wrap">
  <main class="phone" aria-label="AdaptLearn Student Web offline demo">
    <header class="chrome">
      <div class="statusbar"><span>09:41</span><span>Offline demo</span></div>
      <div class="header">
        <div class="brand"><span class="logo">A</span><span><strong>AdaptLearn</strong><small>Student Web</small></span></div>
        <span class="chip">Grade 7 English</span>
      </div>
    </header>
    <section class="scroll">
      <div class="screen active" data-screen="home">
        <section class="panel hero">
          <div><p class="eyebrow">Unit 6</p><span class="unit">U6</span><h1>The Power of Plants</h1><p class="muted">Practice plant vocabulary, photosynthesis inputs/outputs, and evidence-backed explanation.</p></div>
          <div class="plant" aria-hidden="true"></div>
        </section>
        <section class="grid2 summary">
          <div class="panel"><span class="eyebrow">Today</span><strong>Plant processes</strong><p class="muted">Unit 6 task</p></div>
          <div class="panel"><span class="eyebrow">Deadline</span><strong>18:00</strong><p class="muted">Finish today</p></div>
        </section>
        <section class="panel">
          <div class="row"><div><span class="eyebrow">Learning Path</span><h2><span id="doneCount">0</span> of 3 tasks complete</h2></div><button class="secondary" data-go="path">View path</button></div>
          <div class="progress"><span id="studentProgress"></span></div>
          <div class="chips"><span class="chip">15 min</span><span class="chip">Published</span><span class="chip">Safe DTO only</span></div>
        </section>
        <section class="panel task-feature">
          <div class="row"><div><span class="eyebrow">Today's Task</span><h2>Label the parts of a plant</h2></div><span class="pill">Step 1</span></div>
          <p class="muted">The student sees only safe labels and next action, not rule weights or teacher audit details.</p>
          <button class="primary" data-go="task1">Start Task 1</button>
        </section>
        <p class="notice">Prototype data; not a real model result.</p>
      </div>
      <div class="screen" data-screen="path">
        <section class="panel"><span class="eyebrow">Unit 6 Learning Path</span><h1>Build vocabulary, process sequencing, and explanation quality.</h1><div class="chips"><span class="chip">15 min</span><span class="chip">3 tasks</span><span class="chip">Published</span></div></section>
        <section class="screen active">${taskCards}</section>
        <button class="primary" data-go="task1">Start first task</button>
      </div>
      <div class="screen" data-screen="task1">
        <section class="panel"><span class="eyebrow">Task UI01</span><h1>Label the parts of a plant</h1><p class="muted">${escapeHtml(studentTasks[0].prompt)}</p><div class="chips">${studentTasks[0].nodes.map((n) => `<span class="chip">${escapeHtml(n)}</span>`).join("")}</div></section>
        <section class="panel answer-grid" id="task1Choices">
          <button class="choice">Root -> takes in water</button>
          <button class="choice">Stem -> holds the plant up</button>
          <button class="choice">Leaf -> makes food</button>
        </section>
        <button class="primary" id="submitTask1">Submit Task 1</button>
      </div>
      <div class="screen" data-screen="feedback1">
        <section class="panel feedback"><span class="eyebrow">Feedback</span><h1>Nice start</h1><p>You matched the main plant parts. Next, sort photosynthesis ideas into inputs and outputs.</p><div class="chips"><span class="pill">Vocabulary focus</span><span class="chip">Safe feedback only</span></div></section>
        <button class="primary" data-go="task2">Next task</button>
      </div>
      <div class="screen" data-screen="task2">
        <section class="panel"><span class="eyebrow">Task UI02</span><h1>Classify photosynthesis inputs and outputs</h1><p class="muted">${escapeHtml(studentTasks[1].prompt)}</p></section>
        <section class="grid2">
          <div class="panel"><span class="eyebrow">Inputs</span><div class="chips"><span class="chip">Sunlight</span><span class="chip">Water</span><span class="chip">Carbon dioxide</span></div></div>
          <div class="panel"><span class="eyebrow">Outputs</span><div class="chips"><span class="chip">Oxygen</span><span class="chip">Glucose</span></div></div>
        </section>
        <button class="primary" id="submitTask2">Submit Task 2</button>
      </div>
      <div class="screen" data-screen="complete">
        <section class="panel feedback"><span class="eyebrow">Path progress</span><h1>2 of 3 tasks complete</h1><p>Student output remains safe: no ReviewCase details, rule weights, raw BKT/IRT, or teacher-only notes.</p><div class="progress"><span style="width:66%"></span></div></section>
        <button class="secondary" data-go="home">Back home</button>
      </div>
    </section>
    <nav class="bottom" aria-label="Student demo navigation">
      <button class="active" data-go="home">Home</button><button data-go="path">Path</button><button data-go="task1">Task</button>
    </nav>
  </main>
</div>`,
    script: `
const screens=[...document.querySelectorAll('.screen[data-screen]')];
const nav=[...document.querySelectorAll('[data-go]')];
let completed=0;
function go(name){screens.forEach(s=>s.classList.toggle('active',s.dataset.screen===name));document.querySelectorAll('.bottom button').forEach(b=>b.classList.toggle('active',b.dataset.go===name));}
nav.forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
document.querySelectorAll('.choice').forEach(c=>c.addEventListener('click',()=>c.classList.toggle('selected')));
document.getElementById('submitTask1').addEventListener('click',()=>{completed=Math.max(completed,1);document.getElementById('doneCount').textContent=completed;document.getElementById('studentProgress').style.width='33%';go('feedback1');});
document.getElementById('submitTask2').addEventListener('click',()=>{completed=Math.max(completed,2);document.getElementById('doneCount').textContent=completed;document.getElementById('studentProgress').style.width='66%';go('complete');});
`,
  });
}

function adminHtml() {
  const queueRows = adminQueue
    .map(
      (row) => `<tr><td><strong>${escapeHtml(row[0])}</strong><small>${escapeHtml(row[1])}</small></td><td><span class="status ${statusClass(row[2])}">${escapeHtml(row[2])}</span></td><td>${escapeHtml(row[3])}</td><td>${escapeHtml(row[4])}</td></tr>`,
    )
    .join("");
  const taskRows = adminTasks
    .map(
      (row) => `<tr><td><strong>${escapeHtml(row[1])}</strong><small>${escapeHtml(row[0])}</small></td><td>${escapeHtml(row[2])}</td><td>${escapeHtml(row[3])}</td><td><span class="status ${statusClass(row[4])}">${escapeHtml(row[4])}</span></td></tr>`,
    )
    .join("");

  return pageShell({
    title: "AdaptLearn Admin Web - Competition HTML",
    description: "Offline Admin Web demo for judges.",
    style: `
:root{--bg:#f6f8fb;--surface:#fff;--subtle:#f9fafb;--border:#d9e1ea;--text:#17212b;--muted:#5f6c79;--blue:#2563a9;--teal:#087f7a;--green:#237a47;--amber:#a16207;--red:#b42318;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--text);background:var(--bg)}
*{box-sizing:border-box}body{margin:0;min-width:320px;background:var(--bg)}button{font:inherit;cursor:pointer}small{display:block;color:#8391a1;font-size:12px;margin-top:3px}.app{min-height:100vh;display:grid;grid-template-columns:244px 1fr}.side{position:sticky;top:0;height:100vh;display:grid;grid-template-rows:auto 1fr auto;gap:18px;padding:18px 14px;background:#111827;color:#e5edf6}.brand{display:flex;align-items:center;gap:10px;padding:8px}.mark{width:34px;height:34px;display:grid;place-items:center;border-radius:8px;background:var(--teal);color:#fff;font-weight:900}.brand small,.side-note{color:#aebdca;font-size:12px;line-height:1.45}.nav{display:grid;gap:3px;align-content:start}.nav button{min-height:34px;display:flex;align-items:center;gap:9px;border:0;border-radius:6px;background:transparent;color:#cdd9e5;text-align:left;padding:8px 10px;font-weight:700}.nav button.active,.nav button:hover{background:rgba(255,255,255,.09);color:#fff}.main{min-width:0}.scope{position:sticky;top:0;z-index:4;min-height:56px;display:flex;justify-content:space-between;gap:18px;align-items:center;padding:10px 24px;border-bottom:1px solid var(--border);background:rgba(255,255,255,.94);backdrop-filter:blur(12px)}.scope span,.chip{display:inline-flex;align-items:center;border:1px solid var(--border);border-radius:6px;background:#fff;color:var(--muted);padding:5px 8px;font-size:12px;font-weight:800}.page{display:none;gap:16px;padding:20px 24px 28px}.page.active{display:grid}.header{display:flex;justify-content:space-between;align-items:flex-end;gap:20px}.label{color:var(--blue);font-size:12px;font-weight:900;text-transform:uppercase}.header h1{margin:3px 0 4px;font-size:26px;line-height:1.15}.header p,.panel p{margin:0;color:var(--muted);font-size:14px;line-height:1.45}.button{min-height:34px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--blue);border-radius:6px;background:var(--blue);color:#fff;padding:7px 11px;font-weight:800}.button.secondary{background:#fff;color:var(--text);border-color:#b9c5d1}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.metric,.panel{border:1px solid var(--border);border-radius:8px;background:#fff;box-shadow:0 1px 2px rgba(23,33,43,.04)}.metric{display:grid;gap:5px;padding:13px}.metric span{color:var(--muted);font-size:13px;font-weight:800}.metric strong{font-size:26px}.grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(320px,.85fr);gap:16px;align-items:start}.panel{padding:14px;min-width:0}.panel-head{display:flex;justify-content:space-between;gap:12px;margin-bottom:12px}.panel-head h2{margin:2px 0 0;font-size:17px}.table-wrap{overflow:auto;border:1px solid var(--border);border-radius:6px}.table{width:100%;min-width:650px;border-collapse:collapse}.table th,.table td{padding:10px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;font-size:13px}.table th{background:var(--subtle);color:#5f6c79;text-transform:uppercase;font-size:12px}.safe-grid,.review-summary,.trace{display:grid;gap:10px}.safe-grid{grid-template-columns:repeat(2,1fr)}.safe-grid div,.review-summary div,.trace article{border:1px solid var(--border);border-radius:6px;background:var(--subtle);padding:10px}.safe-grid span,.review-summary span{display:block;color:#5f6c79;font-size:12px;font-weight:850}.guard{border-left:4px solid var(--amber);background:#fffaf0}.guard.pass{border-left-color:var(--green);background:#f0fbf5}.decision{display:grid;gap:10px}.decision textarea{width:100%;min-height:86px;border:1px solid var(--border);border-radius:6px;padding:10px}.actions{display:flex;flex-wrap:wrap;gap:8px}.monitor{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.monitor-card{border:1px solid var(--border);border-radius:8px;background:#fff;padding:12px;display:grid;gap:6px}${commonStatusStyles()}@media(max-width:960px){.app{grid-template-columns:1fr}.side{position:static;height:auto}.nav{grid-template-columns:repeat(2,1fr)}.metrics,.grid,.monitor{grid-template-columns:1fr}.safe-grid{grid-template-columns:1fr}.scope{position:static;align-items:flex-start;flex-direction:column}}
`,
    body: `<main class="app">
  <aside class="side"><div class="brand"><span class="mark">A</span><span><strong>AdaptLearn</strong><small>Admin Web</small></span></div><nav class="nav"><button class="active" data-tab="dashboard">Dashboard</button><button data-tab="path">Path review</button><button data-tab="cases">ReviewCases</button><button data-tab="monitoring">Monitoring</button></nav><p class="side-note">Offline competition HTML. Business decisions stay in Admin Web; platform secrets stay in Foundation/FastAPI.</p></aside>
  <section class="main">
    <div class="scope"><div><span>Greenwood Middle School</span> <span>Grade 7 English A</span> <span>Teacher scope</span></div><span class="chip">Prototype data only</span></div>
    <section class="page active" data-page="dashboard">
      <header class="header"><div><span class="label">Business governance</span><h1>Admin Dashboard</h1><p>Scoped queues for content, annotation, diagnosis, paths, ReviewCases, LMS sync, and audit summaries.</p></div><button class="button" data-tab="cases">Open quality queue</button></header>
      <div class="metrics"><article class="metric"><span>Open ReviewCases</span><strong>5</strong><small>Teacher/expert/admin queues</small></article><article class="metric"><span>Paths in review</span><strong>2</strong><small>Cannot publish silently</small></article><article class="metric"><span>Class diagnosis</span><strong>24</strong><small>Evidence labels, no ranking</small></article><article class="metric"><span>LMS retries</span><strong>1</strong><small>Dead letter visible</small></article></div>
      <div class="grid"><section class="panel"><div class="panel-head"><div><span class="label">Priority queue</span><h2>Teacher-readable blockers</h2></div><span class="status review">REVIEW</span></div><div class="table-wrap"><table class="table"><thead><tr><th>Queue item</th><th>Severity</th><th>Owner</th><th>SLA</th></tr></thead><tbody>${queueRows}</tbody></table></div></section><aside class="panel guard"><div class="panel-head"><div><span class="label">Publish guard</span><h2>Path delivery gate</h2></div></div><p>Publishing is blocked while UI17 oral retelling annotation needs expert/teacher review.</p><div class="trace"><article><strong>DecisionTrace</strong><small>trc_path_sunlight_review</small></article><article><strong>Safe projection preview</strong><small>Only student-safe text can be delivered.</small></article></div></aside></div>
    </section>
    <section class="page" data-page="path">
      <header class="header"><div><span class="label">Learning path review</span><h1>Xiaoming Zhang - Unit 6</h1><p>Review path tasks, record teacher decisions, and preview student-safe output.</p></div><span class="status teacher-review">TEACHER_REVIEW</span></header>
      <div class="grid"><section class="panel"><div class="review-summary"><div><span>Goal</span><strong>Build vocabulary, sequencing, and explanation quality.</strong></div><div><span>Class</span><strong>Grade 7 English A</strong></div><div><span>Version</span><strong>v3</strong></div><div><span>Verifier</span><strong>PASS</strong></div></div><br><div class="table-wrap"><table class="table"><thead><tr><th>Task</th><th>Type</th><th>Bloom</th><th>Annotation</th></tr></thead><tbody>${taskRows}</tbody></table></div></section><aside class="panel decision"><span class="label">Teacher decision</span><h2>Approve, modify, reject, replan</h2><textarea id="decisionReason" placeholder="Record a teacher-facing reason before changing this path."></textarea><div class="actions"><button class="button" id="approveBtn">Approve</button><button class="button secondary" id="modifyBtn">Modify</button><button class="button secondary" id="rejectBtn">Reject</button></div><section class="panel guard"><p id="decisionResult">Publish is disabled until review blockers are resolved.</p></section><button class="button" disabled>Publish to students</button></aside></div>
      <section class="panel"><div class="panel-head"><div><span class="label">Student-safe projection</span><h2>What Student Web may see</h2></div></div><div class="safe-grid"><div><span>student_text</span><strong>You will review plant words, sort photosynthesis ideas, then explain sunlight.</strong></div><div><span>safe_reason_chip</span><strong>Vocabulary focus</strong></div><div><span>hidden</span><strong>DecisionTrace, rule weights, component scores</strong></div><div><span>review case</span><strong>Teacher-only</strong></div></div></section>
    </section>
    <section class="page" data-page="cases">
      <header class="header"><div><span class="label">ReviewCase queue</span><h1>Human review boundary</h1><p>REVIEW/BLOCK objects stay in Admin Web and never publish directly to students.</p></div></header>
      <section class="panel"><div class="table-wrap"><table class="table"><thead><tr><th>Case</th><th>Severity</th><th>Owner</th><th>Teacher-readable reason</th></tr></thead><tbody>${queueRows.replaceAll("<td>Today 17:00</td>", "<td>Oral retelling feedback needs teacher confirmation.</td>").replaceAll("<td>Tomorrow 09:00</td>", "<td>Speaking rubric alignment is blocked until expert clears it.</td>").replaceAll("<td>Today 14:00</td>", "<td>LMS publish needs retry or compensation.</td>").replaceAll("<td>Jun 28</td>", "<td>Source page and copyright status must be fixed.</td>")}</tbody></table></div></section>
    </section>
    <section class="page" data-page="monitoring">
      <header class="header"><div><span class="label">Business monitoring</span><h1>LMS, agent, audit status</h1><p>Trace links point to Foundation Console; Admin sees business-safe summaries only.</p></div></header>
      <div class="monitor"><article class="monitor-card"><strong>LMS publish sync</strong><span class="status review">RETRY</span><small>sync_u6_path_publish_42</small></article><article class="monitor-card"><strong>recommend_path</strong><span class="status review">REVIEW</span><small>agent_run_recommend_path_mock</small></article><article class="monitor-card"><strong>Audit export</strong><span class="status pass">PASS</span><small>audit_log_path_review</small></article><article class="monitor-card"><strong>Safe projection</strong><span class="status pass">PASS</span><small>No hidden internals returned</small></article></div>
    </section>
  </section>
</main>`,
    script: `
function show(tab){document.querySelectorAll('[data-page]').forEach(p=>p.classList.toggle('active',p.dataset.page===tab));document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.tab)));
document.getElementById('approveBtn').addEventListener('click',()=>{document.getElementById('decisionResult').textContent='Approve action recorded locally, but publish remains disabled because a BLOCKED annotation exists.'});
document.getElementById('modifyBtn').addEventListener('click',()=>{document.getElementById('decisionResult').textContent='Modify action recorded with reason: '+(document.getElementById('decisionReason').value||'demo reason required')});
document.getElementById('rejectBtn').addEventListener('click',()=>{document.getElementById('decisionResult').textContent='Reject action recorded in DecisionTrace preview.'});
`,
  });
}

function consoleHtml() {
  const nav = consoleSections.map((section) => `<button class="${section.id === "overview" ? "active" : ""}" data-section="${section.id}">${escapeHtml(section.label)}</button>`).join("");
  const sections = consoleSections
    .map(
      (section) => `<section class="page ${section.id === "overview" ? "active" : ""}" data-page="${section.id}">
        <header class="head"><div><span class="label">Platform foundation</span><h1>${escapeHtml(section.label)}</h1><p>${escapeHtml(section.id === "overview" ? "Entry dashboard for tenant, database, queue, storage, RAG, agents, audit, safe projection, and health readiness." : "API registry status rendered from safe mock data for competition review.")}</p></div><div class="meta"><span>mock: true</span><span>api status: Pass</span><span>Prototype data; not a real model result.</span><code>trc_${escapeHtml(section.id)}_offline_demo</code></div></header>
        <div class="metrics">${section.metrics.map((m) => `<article class="metric"><span>${escapeHtml(m[0])}</span><strong>${escapeHtml(m[1])}</strong><p>${escapeHtml(m[2])}</p><code>trc_${escapeHtml(section.id)}_${escapeHtml(m[0].toLowerCase().replaceAll(" ", "_"))}</code></article>`).join("")}</div>
        <div class="grid"><section class="panel"><div class="panel-head"><h2>Readiness Checks</h2><code>audit_log_${escapeHtml(section.id)}</code></div><div class="checks"><article><span class="status pass">Pass</span><strong>No service-role secret in browser</strong><p>Secret values are represented by binding names and status only.</p></article><article><span class="status pass">Pass</span><strong>Student-safe projection only</strong><p>No ReviewCase details, rule weights, raw BKT/IRT, or teacher-only notes.</p></article><article><span class="status warn">Warn</span><strong>Human decision boundary</strong><p>Teacher/expert/Admin decisions stay in Admin Web.</p></article></div></section><section class="panel"><div class="panel-head"><h2>Boundary Warnings</h2><code>trc_boundary_panel</code></div><div class="boundary"><strong>Foundation is platform base</strong><p>It can inspect registry, RLS, storage, RAG, agent, queue, LMS, and audit readiness. It cannot publish student paths or bypass review decisions.</p></div></section></div>
        <section class="panel"><div class="panel-head"><h2>API Registry Status</h2><code>trc_registry_${escapeHtml(section.id)}</code></div><p class="safe">Registry endpoints return resource names, ownership, safe summaries, and trace ids only. Secret values returned: false. Raw student data returned: false.</p><div class="resources">${section.resources.map((r) => `<article><span class="status ${statusClass(r[1])}">${escapeHtml(r[1])}</span><div><strong>${escapeHtml(r[0])}</strong><p>${escapeHtml(r[2])}</p></div><code>trc_resource_${escapeHtml(r[0].toLowerCase().replaceAll(" ", "_").replaceAll("/", "_"))}</code></article>`).join("")}</div></section>
      </section>`,
    )
    .join("");

  return pageShell({
    title: "AdaptLearn Foundational Console - Competition HTML",
    description: "Offline Foundation Console demo for judges.",
    style: `
:root{--bg:#f7f8fa;--panel:#fff;--text:#18202a;--muted:#5f6d7d;--border:#d9dee7;--blue:#245a89;--blue-soft:#eaf2f9;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--text);background:var(--bg)}
*{box-sizing:border-box}body{margin:0;min-width:320px;background:var(--bg)}button{font:inherit;cursor:pointer}.app{min-height:100vh;display:grid;grid-template-columns:312px 1fr}.side{position:sticky;top:0;height:100vh;overflow:auto;border-right:1px solid var(--border);background:#fff;padding:18px 14px}.brand{display:flex;gap:10px;align-items:center;min-height:48px;padding:8px}.mark{width:34px;height:34px;display:grid;place-items:center;border:1px solid #c9d6e4;border-radius:8px;background:#eef4fb;color:var(--blue);font-weight:900}.brand strong{display:block}.brand small,.label,.nav-label,.metric span,.id span{color:var(--muted);font-size:12px;font-weight:850}.nav{display:grid;gap:18px;margin-top:18px}.nav-group{display:grid;gap:6px}.nav-label{text-transform:uppercase;margin:0 8px 4px}.nav button{min-height:38px;display:grid;grid-template-columns:18px 1fr;align-items:center;gap:9px;border:0;border-radius:8px;background:transparent;color:#2d3745;text-align:left;padding:8px;font-size:14px;font-weight:760}.nav button:before{content:"";width:12px;height:12px;border:2px solid currentColor;border-radius:4px}.nav button.active,.nav button:hover{background:var(--blue-soft);color:#184f7c}.main{min-width:0;padding:26px}.page{display:none;gap:18px;width:min(100%,1320px)}.page.active{display:grid}.head{display:grid;grid-template-columns:1fr minmax(260px,390px);gap:18px;align-items:start;padding-bottom:16px;border-bottom:1px solid var(--border)}h1{margin:4px 0 8px;font-size:32px;line-height:1.12}p{margin:0;color:#4d5b6d;line-height:1.5}.meta,.panel,.metric{border:1px solid var(--border);border-radius:8px;background:#fff;box-shadow:0 1px 2px rgba(33,45,63,.06)}.meta{display:grid;gap:7px;align-content:start;justify-items:start;padding:12px}.meta span{font-size:13px;font-weight:760}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.metric{min-height:140px;display:grid;gap:8px;align-content:start;padding:14px;border-top:4px solid #237a57}.metric strong{font-size:23px}.metric p{font-size:14px}.grid{display:grid;grid-template-columns:1.15fr .85fr;gap:14px}.panel{padding:14px}.panel-head{display:flex;justify-content:space-between;gap:12px;padding-bottom:10px;border-bottom:1px solid #e0e5ec}.panel-head h2{margin:0;font-size:17px}code{border:1px solid #dce4ee;border-radius:6px;background:#f6f9fc;color:#3f5065;padding:2px 6px;font-size:12px;overflow-wrap:anywhere}.checks,.resources{display:grid;gap:10px;margin-top:12px}.checks article{display:grid;gap:6px;border-bottom:1px solid #edf0f4;padding:10px 0}.boundary{border:1px solid var(--border);border-left:4px solid #b7791f;border-radius:8px;background:#fbfcfe;padding:11px;margin-top:12px}.safe{border:1px solid #dce3ec;border-radius:8px;background:#fbfcfe;padding:12px;margin-top:12px}.resources article{display:grid;grid-template-columns:120px 1fr minmax(180px,320px);gap:12px;align-items:start;border-top:1px solid #edf0f4;padding-top:10px}.resources strong,.checks strong{display:block;color:#1f2937}.resources p,.checks p{font-size:14px}${commonStatusStyles()}@media(max-width:1060px){.app{grid-template-columns:1fr}.side{position:static;height:auto}.head,.grid,.metrics,.resources article{grid-template-columns:1fr}.nav{grid-template-columns:repeat(2,1fr)}}@media(max-width:680px){.main{padding:16px}.nav{grid-template-columns:1fr}.metrics{grid-template-columns:1fr}h1{font-size:25px}}
`,
    body: `<main class="app"><aside class="side"><div class="brand"><span class="mark">A</span><span><strong>AdaptLearn</strong><small>Foundational Console</small></span></div><nav class="nav"><section class="nav-group"><p class="nav-label">Platform Base / RAG / Governance</p>${nav}</section></nav></aside><section class="main">${sections}</section></main>`,
    script: `
function show(section){document.querySelectorAll('[data-page]').forEach(p=>p.classList.toggle('active',p.dataset.page===section));document.querySelectorAll('[data-section]').forEach(b=>b.classList.toggle('active',b.dataset.section===section));}
document.querySelectorAll('[data-section]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.section)));
`,
  });
}

function indexHtml() {
  const cards = [
    {
      href: "student.html",
      label: "Student Web",
      title: "Mobile-first learning path",
      description: "Judge the learner journey: Home -> Path -> Task 1 submit -> feedback -> Task 2.",
      meta: ["Safe DTO", "No rankings", "Offline"],
      accent: "green",
    },
    {
      href: "admin.html",
      label: "Admin Web",
      title: "Teacher and operator governance",
      description: "Review queues, path approval, LMS sync states, and student-safe projection boundaries.",
      meta: ["ReviewCase", "DecisionTrace", "Scoped"],
      accent: "blue",
    },
    {
      href: "foundation-console.html",
      label: "Foundational Console",
      title: "Platform foundation and RAG ops",
      description: "Inspect storage, RAG registry, agent/tool audit, LMS adapter, queue, and environment readiness.",
      meta: ["RAG", "Agent audit", "Secrets excluded"],
      accent: "slate",
    },
  ];

  return pageShell({
    title: "AdaptLearn Competition Demo Pack",
    description: "Static AdaptLearn demo entrypoint for competition judges.",
    style: `
:root{--bg:#f5f7f8;--panel:#fff;--text:#15231f;--muted:#60706b;--border:#d7dfdb;--green:#16845f;--blue:#2563a9;--slate:#344155;--amber:#b7791f;--shadow:0 18px 48px rgba(20,35,31,.12);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--text);background:var(--bg)}
*{box-sizing:border-box}body{margin:0;min-width:320px;background:linear-gradient(130deg,rgba(22,132,95,.13),transparent 34%),linear-gradient(300deg,rgba(37,99,169,.12),transparent 30%),var(--bg)}a{color:inherit;text-decoration:none}.wrap{min-height:100vh;display:grid;grid-template-rows:auto 1fr auto}.top{min-height:64px;display:flex;justify-content:space-between;align-items:center;gap:16px;padding:14px 28px;border-bottom:1px solid rgba(215,223,219,.82);background:rgba(255,255,255,.82);backdrop-filter:blur(16px)}.brand{display:flex;align-items:center;gap:10px}.mark{width:38px;height:38px;display:grid;place-items:center;border-radius:9px;background:#eaf7f0;color:var(--green);font-weight:950}.brand strong{display:block}.brand small{display:block;color:var(--muted);font-size:12px}.badge{display:inline-flex;align-items:center;min-height:30px;border:1px solid var(--border);border-radius:999px;background:#fff;padding:5px 10px;color:#4f625d;font-size:12px;font-weight:850}.main{width:min(1180px,100%);margin:0 auto;padding:34px 22px 28px;display:grid;gap:22px}.hero{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,420px);gap:22px;align-items:stretch}.intro{display:grid;align-content:center;gap:14px;padding:30px 0}.label{color:var(--green);font-size:12px;font-weight:950;text-transform:uppercase;letter-spacing:.08em}h1{margin:0;font-size:50px;line-height:1.02;letter-spacing:0}p{margin:0;color:var(--muted);line-height:1.55}.intro p{max-width:680px;font-size:17px}.diagram{position:relative;min-height:300px;border:1px solid var(--border);border-radius:8px;background:#fff;box-shadow:var(--shadow);overflow:hidden}.diagram:before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(22,132,95,.07),transparent 55%),linear-gradient(180deg,rgba(37,99,169,.08),transparent 44%)}.node{position:absolute;display:grid;gap:5px;width:142px;border:1px solid var(--border);border-radius:8px;background:#fff;padding:12px;box-shadow:0 8px 22px rgba(21,35,31,.08)}.node strong{font-size:14px}.node span{font-size:12px;color:var(--muted);font-weight:800}.node.student{left:24px;top:32px;border-top:4px solid var(--green)}.node.admin{right:28px;top:72px;border-top:4px solid var(--blue)}.node.foundation{left:112px;bottom:30px;width:184px;border-top:4px solid var(--slate)}.line{position:absolute;height:2px;background:#c8d4ce;transform-origin:left center}.line.one{left:154px;top:92px;width:145px;transform:rotate(9deg)}.line.two{right:168px;top:166px;width:155px;transform:rotate(151deg)}.line.three{left:168px;bottom:96px;width:190px;transform:rotate(-28deg)}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.card{min-height:264px;display:grid;grid-template-rows:auto 1fr auto;gap:16px;border:1px solid var(--border);border-radius:8px;background:#fff;padding:18px;box-shadow:0 1px 2px rgba(21,35,31,.05);transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}.card:hover{transform:translateY(-3px);box-shadow:0 14px 32px rgba(21,35,31,.12);border-color:#bfd0c8}.card.green{border-top:5px solid var(--green)}.card.blue{border-top:5px solid var(--blue)}.card.slate{border-top:5px solid var(--slate)}.card h2{margin:4px 0 8px;font-size:23px;line-height:1.15}.meta{display:flex;flex-wrap:wrap;gap:7px}.pill{display:inline-flex;border:1px solid var(--border);border-radius:999px;background:#fbfcfb;padding:4px 8px;color:#556862;font-size:12px;font-weight:800}.open{display:flex;align-items:center;justify-content:space-between;gap:12px;color:#17342f;font-weight:900}.arrow{width:34px;height:34px;display:grid;place-items:center;border-radius:50%;background:#eef6f2;color:var(--green);font-size:20px}.notes{display:grid;grid-template-columns:1fr 1fr;gap:14px}.note{border:1px solid var(--border);border-radius:8px;background:rgba(255,255,255,.82);padding:15px}.note strong{display:block;margin-bottom:6px}.footer{padding:18px 28px;color:#697873;font-size:12px}.footer code{border:1px solid var(--border);border-radius:6px;background:#fff;padding:2px 6px;color:#465b55}@media(max-width:900px){.hero,.cards,.notes{grid-template-columns:1fr}.intro{padding:10px 0}.diagram{min-height:260px}h1{font-size:38px}.top{align-items:flex-start;flex-direction:column}.badge{align-self:flex-start}}@media(max-width:560px){.main{padding:24px 14px}.diagram{display:none}h1{font-size:32px}.card{min-height:auto}.footer{padding:16px 14px}}
`,
    body: `<div class="wrap">
  <style>.cards .meta{align-content:flex-start;align-items:flex-start}.cards .pill{min-height:24px;align-items:center}</style>
  <header class="top">
    <div class="brand"><span class="mark">A</span><span><strong>AdaptLearn</strong><small>Competition demo pack</small></span></div>
    <span class="badge">Static HTML · mock data · no secrets</span>
  </header>
  <main class="main">
    <section class="hero">
      <div class="intro">
        <span class="label">Judge entrypoint</span>
        <h1>Three runnable AdaptLearn surfaces in one static package.</h1>
        <p>Open the demos locally or host this folder as a static site. The product pages preserve the current Student, Admin, and Foundational Console flows while excluding service keys, raw student data, hidden rule weights, and teacher-only review detail.</p>
      </div>
      <aside class="diagram" aria-label="AdaptLearn platform map">
        <div class="line one"></div><div class="line two"></div><div class="line three"></div>
        <article class="node student"><strong>Student Web</strong><span>safe learning path</span></article>
        <article class="node admin"><strong>Admin Web</strong><span>human review</span></article>
        <article class="node foundation"><strong>Foundational Console</strong><span>RAG, agents, audit, queues</span></article>
      </aside>
    </section>
    <section class="cards" aria-label="Demo pages">
      ${cards
        .map(
          (card) => `<a class="card ${card.accent}" href="${card.href}">
        <div><span class="label">${escapeHtml(card.label)}</span><h2>${escapeHtml(card.title)}</h2><p>${escapeHtml(card.description)}</p></div>
        <div class="meta">${card.meta.map((item) => `<span class="pill">${escapeHtml(item)}</span>`).join("")}</div>
        <span class="open">Open ${escapeHtml(card.label)}<span class="arrow">›</span></span>
      </a>`,
        )
        .join("")}
    </section>
    <section class="notes">
      <article class="note"><strong>For online submission</strong><p>Upload the entire <code>competition-html</code> folder to any static host. The public URL should point to <code>index.html</code>; the three demo pages are linked from there.</p></article>
      <article class="note"><strong>For offline judging</strong><p>Double-click <code>index.html</code> after unzipping. All CSS and JavaScript are embedded, so no server or npm install is required.</p></article>
    </section>
  </main>
  <footer class="footer">Generated from <code>scripts/generate_competition_html.mjs</code>. Prototype data only; not a real model result.</footer>
</div>`,
  });
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const files = [
    ["index.html", indexHtml()],
    ["student.html", studentHtml()],
    ["admin.html", adminHtml()],
    ["foundation-console.html", consoleHtml()],
    [
      "README.md",
      `# AdaptLearn Competition HTML Pack

This folder is a static, judge-ready demo package. It contains mock/prototype data only and no real Supabase, OpenAI, Redis, LMS, database, or service-role secrets.

## Recommended entry

Open or deploy:

- index.html

The entry page links to the three requested product demos:

- student.html
- admin.html
- foundation-console.html

## Local/offline judging

Unzip the package and double-click index.html. Every demo is a standalone HTML file with embedded CSS and JavaScript, so no npm install, backend server, Supabase project, Redis, LMS, or OpenAI key is required.

## Online URL submission

Upload the entire competition-html folder to a static host such as Vercel, Netlify, Cloudflare Pages, GitHub Pages, or any object-storage static website host.

Use index.html as the public entry URL. Relative links are used, so the package works from the site root or a subfolder.

## Safety boundary

The Student Web page does not expose internal rule weights, teacher review records, ReviewCase details, other student data, precise rankings, service keys, queue credentials, LMS secrets, or raw RAG chunks.
`,
    ],
    [
      "vercel.json",
      `{
  "rewrites": [
    {
      "source": "/",
      "destination": "/index.html"
    }
  ]
}
`,
    ],
    [
      "netlify.toml",
      `[build]
  publish = "."

[[redirects]]
  from = "/"
  to = "/index.html"
  status = 200
`,
    ],
  ];
  await Promise.all(files.map(([name, contents]) => writeFile(path.join(outDir, name), contents, "utf8")));
  for (const [name] of files) {
    console.log(path.join(outDir, name));
  }
}

await main();
