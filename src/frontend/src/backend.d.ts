import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Timestamp = bigint;
export interface RNDProgram {
    id: EntityId;
    status: ProgramStatus;
    updated_at: Timestamp;
    name: string;
    description: string;
    created_at: Timestamp;
    irc_section: string;
}
export interface ConversationEntry {
    content: string;
    role: string;
    timestamp: Timestamp;
}
export type EntityId = string;
export interface FourPartTestResult {
    elimination_of_uncertainty: boolean;
    permitted_purpose: boolean;
    notes: string;
    technological_in_nature: boolean;
    process_of_experimentation: boolean;
}
export interface Enrollment {
    id: EntityId;
    status: EnrollmentStatus;
    user_principal: UserId;
    program_id: EntityId;
    enrolled_at: Timestamp;
    reviewed_at?: Timestamp;
    reviewed_by?: UserId;
    review_notes?: string;
}
export interface CreateActivityResult {
    activity: RDActivity;
    classification: ClassificationResult;
}
export interface Report {
    id: EntityId;
    period_end: string;
    activity_ids: Array<EntityId>;
    generated_at: Timestamp;
    period_start: string;
    eligible_hours: number;
    scope: ReportScope;
    total_hours: number;
    breakdown_borderline: bigint;
    breakdown_ineligible: bigint;
    estimated_qre_value: number;
    breakdown_eligible: bigint;
}
export interface CreateRetroSessionInput {
    time_range_end: string;
    time_range_start: string;
}
export interface MetricEntry {
    value: string;
    name: string;
}
export interface CreateExperimentInput {
    method: string;
    metrics: Array<MetricEntry>;
    linked_activity_id?: EntityId;
    program_id?: EntityId;
    hypothesis: string;
    results_summary: string;
    outcome: ExperimentOutcome;
}
export interface AuditEntry {
    id: EntityId;
    action: string;
    timestamp: Timestamp;
    actor_principal: UserId;
    entity_id: EntityId;
    entity_type: string;
}
export interface GlobalStats {
    total_programs: bigint;
    total_users: bigint;
    pending_enrollments: bigint;
    total_approved_hours: number;
    submitted_activities: bigint;
    global_qre_value: number;
}
export interface AdminSuggestion {
    notes: string;
    recommendation: Recommendation;
    confidence: bigint;
}
export interface AddRetroMessageInput {
    content: string;
    session_id: EntityId;
    role: string;
}
export type UserId = string;
export interface ClassificationResult {
    eligibility_label: EligibilityLabel;
    eligibility_score: number;
    quantum_adjusted_score: number;
    four_part_test: FourPartTestResult;
    suggested_tags: Array<string>;
    admin_suggestion: AdminSuggestion;
    agent_reasoning: string;
}
export interface RetroSession {
    id: EntityId;
    status: RetroSessionStatus;
    user_principal: UserId;
    updated_at: Timestamp;
    time_range_end: string;
    conversation: Array<ConversationEntry>;
    created_at: Timestamp;
    candidate_activities: Array<RDActivity>;
    time_range_start: string;
}
export interface Experiment {
    id: EntityId;
    method: string;
    user_principal: UserId;
    updated_at: Timestamp;
    metrics: Array<MetricEntry>;
    linked_activity_id?: EntityId;
    program_id?: EntityId;
    hypothesis: string;
    created_at: Timestamp;
    results_summary: string;
    outcome: ExperimentOutcome;
}
export interface CreateActivityInput {
    activity_type: ActivityType;
    title: string;
    tags: Array<string>;
    program_id?: EntityId;
    description: string;
    end_date?: string;
    start_date: string;
    hours_spent: number;
}
export interface UserProfile {
    updated_at: Timestamp;
    role: Role;
    created_at: Timestamp;
    email?: string;
    principal_id: UserId;
}
export interface RDActivity {
    id: EntityId;
    status: ActivityStatus;
    activity_type: ActivityType;
    user_principal: UserId;
    title: string;
    updated_at: Timestamp;
    content_hash: string;
    tags: Array<string>;
    program_id?: EntityId;
    description: string;
    end_date?: string;
    eligibility_label: EligibilityLabel;
    created_at: Timestamp;
    eligibility_score: number;
    quantum_adjusted_score: number;
    start_date: string;
    admin_notes?: string;
    agent_reasoning: string;
    hours_spent: number;
    four_part_test_result: FourPartTestResult;
}
export enum ActivityStatus {
    submitted = "submitted",
    approved = "approved",
    rejected = "rejected",
    draft = "draft"
}
export enum ActivityType {
    retroactive = "retroactive",
    ongoing = "ongoing"
}
export enum EligibilityLabel {
    borderline = "borderline",
    ineligible = "ineligible",
    eligible = "eligible"
}
export enum EnrollmentStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum ExperimentOutcome {
    failure = "failure",
    inconclusive = "inconclusive",
    success = "success"
}
export enum ProgramStatus {
    active = "active",
    inactive = "inactive"
}
export enum Recommendation {
    reject = "reject",
    approve = "approve",
    more_info = "more_info"
}
export enum ReportScope {
    user = "user",
    global = "global"
}
export enum RetroSessionStatus {
    active = "active",
    completed = "completed"
}
export enum Role {
    admin = "admin",
    user = "user"
}
export interface backendInterface {
    add_retro_message(input: AddRetroMessageInput): Promise<RetroSession>;
    admin_create_program(name: string, description: string, irc_section: string | null): Promise<RNDProgram>;
    admin_list_activities(user_principal_filter: UserId | null, status_filter: ActivityStatus | null, program_id_filter: EntityId | null): Promise<Array<RDActivity>>;
    admin_list_enrollments(status_filter: EnrollmentStatus | null): Promise<Array<Enrollment>>;
    admin_list_users(): Promise<Array<UserProfile>>;
    admin_review_activity(id: EntityId, decision: ActivityStatus, notes: string | null): Promise<RDActivity>;
    admin_review_enrollment(id: EntityId, decision: EnrollmentStatus, notes: string | null): Promise<Enrollment>;
    admin_set_user_role(target_principal: UserId, role: Role): Promise<UserProfile>;
    complete_retro_session(session_id: EntityId): Promise<RetroSession>;
    create_activity(input: CreateActivityInput): Promise<CreateActivityResult>;
    create_experiment(input: CreateExperimentInput): Promise<Experiment>;
    enroll_in_program(program_id: EntityId): Promise<Enrollment>;
    export_report_csv(report_id: EntityId): Promise<string>;
    generate_global_report(period_start: string, period_end: string): Promise<Report>;
    generate_user_report(user_principal: UserId, period_start: string, period_end: string): Promise<Report>;
    get_audit_trail(entity_id: EntityId, limit: bigint): Promise<Array<AuditEntry>>;
    get_global_stats(): Promise<GlobalStats>;
    get_my_profile(): Promise<UserProfile>;
    list_my_activities(status_filter: ActivityStatus | null, program_id_filter: EntityId | null): Promise<Array<RDActivity>>;
    list_my_experiments(): Promise<Array<Experiment>>;
    list_programs(): Promise<Array<RNDProgram>>;
    list_retro_sessions(): Promise<Array<RetroSession>>;
    start_retro_session(input: CreateRetroSessionInput): Promise<RetroSession>;
    update_experiment(id: EntityId, input: CreateExperimentInput): Promise<Experiment>;
    upsert_profile(email: string | null): Promise<UserProfile>;
}
