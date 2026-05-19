import type { backendInterface } from "../backend";
import {
  ActivityStatus,
  ActivityType,
  EligibilityLabel,
  EnrollmentStatus,
  ExperimentOutcome,
  ProgramStatus,
  Recommendation,
  ReportScope,
  RetroSessionStatus,
  Role,
} from "../backend";

const NOW = BigInt(Date.now()) * BigInt(1_000_000);
const HOUR_AGO = NOW - BigInt(3_600_000_000_000);

const mockActivity1 = {
  id: "act-001",
  status: ActivityStatus.submitted,
  activity_type: ActivityType.ongoing,
  user_principal: "user-abc-123",
  title: "Quantum Canister Architecture Research",
  updated_at: NOW,
  content_hash: "sha256:abc1234def5678",
  tags: ["Blockchain/Web3 R&D", "System Architecture", "Algorithm Design"],
  program_id: "prog-001",
  description:
    "Investigated novel distributed canister architecture for handling high-frequency R&D classification workloads on the Internet Computer. Explored unknown algorithmic approaches to reduce latency and improve throughput for real-time inference pipelines.",
  end_date: "2026-04-30",
  eligibility_label: EligibilityLabel.eligible,
  created_at: HOUR_AGO,
  eligibility_score: 92,
  quantum_adjusted_score: 94,
  start_date: "2026-03-01",
  admin_notes: undefined,
  agent_reasoning:
    "Activity demonstrates strong technical uncertainty and experimentation. All four IRC §41 criteria satisfied. High entanglement score boosts quantum-adjusted result.",
  hours_spent: 42,
  four_part_test_result: {
    permitted_purpose: true,
    technological_in_nature: true,
    elimination_of_uncertainty: true,
    process_of_experimentation: true,
    notes:
      "All four criteria met. Strong evidence of research intent, technical methods, and systematic experimentation.",
  },
};

const mockActivity2 = {
  id: "act-002",
  status: ActivityStatus.approved,
  activity_type: ActivityType.retroactive,
  user_principal: "user-abc-123",
  title: "ML Inference Pipeline Optimization",
  updated_at: NOW,
  content_hash: "sha256:xyz9876abc5432",
  tags: ["ML/AI Research", "Performance Optimization"],
  program_id: "prog-001",
  description:
    "Researched and developed an optimized machine learning inference pipeline using novel batching algorithms. Encountered significant uncertainty around model quantization tradeoffs and conducted multiple experiments to validate performance.",
  end_date: "2026-02-28",
  eligibility_label: EligibilityLabel.eligible,
  created_at: HOUR_AGO,
  eligibility_score: 88,
  quantum_adjusted_score: 90,
  start_date: "2026-01-15",
  admin_notes: "Approved. Excellent documentation of experimental process.",
  agent_reasoning:
    "Strong evidence of systematic research with clear uncertainty elimination. Hours appropriate for scope.",
  hours_spent: 78,
  four_part_test_result: {
    permitted_purpose: true,
    technological_in_nature: true,
    elimination_of_uncertainty: true,
    process_of_experimentation: true,
    notes: "All criteria met with strong supporting evidence.",
  },
};

const mockActivity3 = {
  id: "act-003",
  status: ActivityStatus.submitted,
  activity_type: ActivityType.ongoing,
  user_principal: "user-def-456",
  title: "API Integration Development",
  updated_at: NOW,
  content_hash: "sha256:mno1122pqr3344",
  tags: ["Testing & Validation"],
  description:
    "Built API integration layer connecting frontend to backend services. Encountered some challenges with authentication flow.",
  end_date: "2026-04-15",
  eligibility_label: EligibilityLabel.borderline,
  created_at: HOUR_AGO,
  eligibility_score: 55,
  quantum_adjusted_score: 58,
  start_date: "2026-03-20",
  admin_notes: undefined,
  agent_reasoning:
    "Partially meets IRC §41 criteria. Technological nature confirmed but insufficient evidence of systematic experimentation. Borderline classification.",
  hours_spent: 24,
  four_part_test_result: {
    permitted_purpose: true,
    technological_in_nature: true,
    elimination_of_uncertainty: false,
    process_of_experimentation: false,
    notes:
      "Only 2 of 4 parts satisfied. Lacks documented experimentation process and uncertainty elimination evidence.",
  },
};

export const mockBackend: backendInterface = {
  get_my_profile: async () => ({
    principal_id: "user-abc-123",
    role: Role.admin,
    email: "researcher@influwealth.com",
    created_at: HOUR_AGO,
    updated_at: NOW,
  }),

  upsert_profile: async () => ({
    principal_id: "user-abc-123",
    role: Role.admin,
    email: "researcher@influwealth.com",
    created_at: HOUR_AGO,
    updated_at: NOW,
  }),

  admin_list_users: async () => [
    {
      principal_id: "user-abc-123",
      role: Role.admin,
      email: "researcher@influwealth.com",
      created_at: HOUR_AGO,
      updated_at: NOW,
    },
    {
      principal_id: "user-def-456",
      role: Role.user,
      email: "analyst@influwealth.com",
      created_at: HOUR_AGO,
      updated_at: NOW,
    },
  ],

  admin_set_user_role: async (_principal, _role) => ({
    principal_id: "user-abc-123",
    role: Role.admin,
    email: "researcher@influwealth.com",
    created_at: HOUR_AGO,
    updated_at: NOW,
  }),

  list_programs: async () => [
    {
      id: "prog-001",
      name: "ICP Blockchain R&D Initiative 2026",
      description:
        "Systematic research into distributed canister architectures and novel consensus mechanisms on the Internet Computer Protocol.",
      irc_section: "41",
      status: ProgramStatus.active,
      created_at: HOUR_AGO,
      updated_at: NOW,
    },
    {
      id: "prog-002",
      name: "AI/ML Inference Research Program",
      description:
        "Advanced machine learning research focused on novel inference techniques, model optimization, and uncertainty quantification.",
      irc_section: "41",
      status: ProgramStatus.active,
      created_at: HOUR_AGO,
      updated_at: NOW,
    },
  ],

  admin_create_program: async (name, description, irc_section) => ({
    id: "prog-new",
    name,
    description,
    irc_section: irc_section ?? "41",
    status: ProgramStatus.active,
    created_at: NOW,
    updated_at: NOW,
  }),

  enroll_in_program: async (program_id) => ({
    id: "enroll-001",
    user_principal: "user-abc-123",
    program_id,
    status: EnrollmentStatus.pending,
    enrolled_at: NOW,
  }),

  admin_list_enrollments: async () => [
    {
      id: "enroll-001",
      user_principal: "user-def-456",
      program_id: "prog-001",
      status: EnrollmentStatus.pending,
      enrolled_at: HOUR_AGO,
    },
    {
      id: "enroll-002",
      user_principal: "user-abc-123",
      program_id: "prog-002",
      status: EnrollmentStatus.approved,
      enrolled_at: HOUR_AGO,
      reviewed_by: "admin-001",
      reviewed_at: NOW,
      review_notes: "Strong R&D background confirmed.",
    },
  ],

  admin_review_enrollment: async (id, decision, notes) => ({
    id,
    user_principal: "user-def-456",
    program_id: "prog-001",
    status: decision,
    enrolled_at: HOUR_AGO,
    reviewed_by: "admin-001",
    reviewed_at: NOW,
    review_notes: notes ?? undefined,
  }),

  create_activity: async (input) => ({
    activity: {
      id: "act-new",
      status: ActivityStatus.draft,
      activity_type: input.activity_type,
      user_principal: "user-abc-123",
      title: input.title,
      updated_at: NOW,
      content_hash: "sha256:newactivity001",
      tags: input.tags,
      program_id: input.program_id,
      description: input.description,
      end_date: input.end_date,
      eligibility_label: EligibilityLabel.eligible,
      created_at: NOW,
      eligibility_score: 85,
      quantum_adjusted_score: 88,
      start_date: input.start_date,
      agent_reasoning:
        "Strong evidence of technical research with systematic experimentation approach.",
      hours_spent: input.hours_spent,
      four_part_test_result: {
        permitted_purpose: true,
        technological_in_nature: true,
        elimination_of_uncertainty: true,
        process_of_experimentation: true,
        notes: "All four IRC §41 criteria satisfied.",
      },
    },
    classification: {
      eligibility_label: EligibilityLabel.eligible,
      eligibility_score: 85,
      quantum_adjusted_score: 88,
      four_part_test: {
        permitted_purpose: true,
        technological_in_nature: true,
        elimination_of_uncertainty: true,
        process_of_experimentation: true,
        notes: "All four IRC §41 criteria satisfied.",
      },
      suggested_tags: ["Algorithm Design", "System Architecture"],
      admin_suggestion: {
        recommendation: Recommendation.approve,
        confidence: BigInt(90),
        notes:
          "LIKELY APPROVE — all four parts passed and quantum-adjusted score ≥ 80. Activity demonstrates strong research intent.",
      },
      agent_reasoning:
        "Activity meets all IRC §41 criteria. Strong documentation of technical uncertainty and experimental methodology.",
    },
  }),

  list_my_activities: async () => [mockActivity1, mockActivity2],

  admin_list_activities: async () => [mockActivity1, mockActivity2, mockActivity3],

  admin_review_activity: async (id, decision, notes) => ({
    ...mockActivity1,
    id,
    status: decision,
    admin_notes: notes ?? undefined,
    updated_at: NOW,
  }),

  create_experiment: async (input) => ({
    id: "exp-001",
    user_principal: "user-abc-123",
    hypothesis: input.hypothesis,
    method: input.method,
    results_summary: input.results_summary,
    metrics: input.metrics,
    outcome: input.outcome,
    linked_activity_id: input.linked_activity_id,
    program_id: input.program_id,
    created_at: NOW,
    updated_at: NOW,
  }),

  update_experiment: async (id, input) => ({
    id,
    user_principal: "user-abc-123",
    hypothesis: input.hypothesis,
    method: input.method,
    results_summary: input.results_summary,
    metrics: input.metrics,
    outcome: input.outcome,
    linked_activity_id: input.linked_activity_id,
    program_id: input.program_id,
    created_at: HOUR_AGO,
    updated_at: NOW,
  }),

  list_my_experiments: async () => [
    {
      id: "exp-001",
      user_principal: "user-abc-123",
      hypothesis:
        "Applying superposition-inspired batching will reduce ICP canister query latency by 40%.",
      method:
        "Implemented parallel query batching in Motoko, benchmarked against sequential baseline across 1000 iterations.",
      results_summary:
        "Achieved 38% latency reduction. Hypothesis substantially confirmed. Novel batching approach patent-pending.",
      metrics: [
        { name: "Baseline Latency (ms)", value: "245" },
        { name: "Optimized Latency (ms)", value: "152" },
        { name: "Improvement %", value: "38" },
      ],
      outcome: ExperimentOutcome.success,
      linked_activity_id: "act-001",
      program_id: "prog-001",
      created_at: HOUR_AGO,
      updated_at: NOW,
    },
  ],

  start_retro_session: async (input) => ({
    id: "retro-001",
    user_principal: "user-abc-123",
    time_range_start: input.time_range_start,
    time_range_end: input.time_range_end,
    status: RetroSessionStatus.active,
    conversation: [
      {
        role: "agent",
        content:
          "Let's capture your R&D activities from that period. What were your major technical projects during this time?",
        timestamp: NOW,
      },
    ],
    candidate_activities: [],
    created_at: NOW,
    updated_at: NOW,
  }),

  add_retro_message: async (input) => ({
    id: "retro-001",
    user_principal: "user-abc-123",
    time_range_start: "2025-01-01",
    time_range_end: "2025-12-31",
    status: RetroSessionStatus.active,
    conversation: [
      {
        role: "agent",
        content:
          "Let's capture your R&D activities from that period. What were your major technical projects during this time?",
        timestamp: HOUR_AGO,
      },
      { role: "user", content: input.content, timestamp: NOW },
      {
        role: "agent",
        content:
          "Great! For your ICP canister research: was there a specific technical problem you weren't sure how to solve? Describe the uncertainty you faced.",
        timestamp: NOW,
      },
    ],
    candidate_activities: [],
    created_at: HOUR_AGO,
    updated_at: NOW,
  }),

  complete_retro_session: async (session_id) => ({
    id: session_id,
    user_principal: "user-abc-123",
    time_range_start: "2025-01-01",
    time_range_end: "2025-12-31",
    status: RetroSessionStatus.completed,
    conversation: [],
    candidate_activities: [mockActivity1],
    created_at: HOUR_AGO,
    updated_at: NOW,
  }),

  list_retro_sessions: async () => [
    {
      id: "retro-001",
      user_principal: "user-abc-123",
      time_range_start: "2025-01-01",
      time_range_end: "2025-12-31",
      status: RetroSessionStatus.completed,
      conversation: [],
      candidate_activities: [mockActivity1],
      created_at: HOUR_AGO,
      updated_at: NOW,
    },
  ],

  generate_user_report: async (user_principal, period_start, period_end) => ({
    id: "report-001",
    scope: ReportScope.user,
    period_start,
    period_end,
    activity_ids: ["act-001", "act-002"],
    total_hours: 120,
    eligible_hours: 100,
    estimated_qre_value: 15000,
    breakdown_eligible: BigInt(2),
    breakdown_borderline: BigInt(1),
    breakdown_ineligible: BigInt(0),
    generated_at: NOW,
  }),

  generate_global_report: async (period_start, period_end) => ({
    id: "report-global-001",
    scope: ReportScope.global,
    period_start,
    period_end,
    activity_ids: ["act-001", "act-002", "act-003"],
    total_hours: 280,
    eligible_hours: 220,
    estimated_qre_value: 33000,
    breakdown_eligible: BigInt(4),
    breakdown_borderline: BigInt(2),
    breakdown_ineligible: BigInt(1),
    generated_at: NOW,
  }),

  export_report_csv: async () =>
    "user_principal,title,activity_type,start_date,end_date,hours_spent,eligibility_label,quantum_adjusted_score,four_part_passed_count,estimated_qre_contribution,status,approved_at\nuser-abc-123,Quantum Canister Architecture Research,ongoing,2026-03-01,2026-04-30,42,eligible,94,4,6300,submitted,\nuser-abc-123,ML Inference Pipeline Optimization,retroactive,2026-01-15,2026-02-28,78,eligible,90,4,11700,approved,2026-05-01",

  get_global_stats: async () => ({
    total_users: BigInt(12),
    total_programs: BigInt(3),
    pending_enrollments: BigInt(4),
    submitted_activities: BigInt(7),
    total_approved_hours: 340,
    global_qre_value: 51000,
  }),

  get_audit_trail: async (entity_id) => [
    {
      id: "audit-001",
      actor_principal: "admin-001",
      action: "activity.submitted",
      entity_type: "RDActivity",
      entity_id,
      timestamp: HOUR_AGO,
    },
    {
      id: "audit-002",
      actor_principal: "system",
      action: "activity.classified",
      entity_type: "RDActivity",
      entity_id,
      timestamp: NOW,
    },
  ],
};
