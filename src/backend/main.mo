import Map "mo:core/Map";
import Common "types/common";
import ProfileTypes "types/profiles";
import ProgramTypes "types/programs";
import ActivityTypes "types/activities";
import ExperimentTypes "types/experiments";
import RetroTypes "types/retro";
import ReportTypes "types/reports";
import AuditTypes "types/audit";
import ProgramsMixin "mixins/programs-api";
import ActivitiesMixin "mixins/activities-api";
import ExperimentsMixin "mixins/experiments-api";
import RetroMixin "mixins/retro-api";
import ReportsMixin "mixins/reports-api";
import ProfilesMixin "mixins/profiles-api";

actor {
  // ─── Persistent state (enhanced orthogonal persistence) ─────────────────────
  let users = Map.empty<Common.UserId, ProfileTypes.UserProfile>();
  let programs = Map.empty<Common.EntityId, ProgramTypes.RNDProgram>();
  let enrollments = Map.empty<Common.EntityId, ProgramTypes.Enrollment>();
  let activities = Map.empty<Common.EntityId, ActivityTypes.RDActivity>();
  let experiments = Map.empty<Common.EntityId, ExperimentTypes.Experiment>();
  let retro_sessions = Map.empty<Common.EntityId, RetroTypes.RetroSession>();
  let reports = Map.empty<Common.EntityId, ReportTypes.Report>();
  let audit_entries = Map.empty<Common.EntityId, AuditTypes.AuditEntry>();

  // Shared mutable counters wrapped in a record so mixins mutate by reference
  let state = { var next_id : Nat = 0 };

  // ─── Mixin inclusions ────────────────────────────────────────────────────────
  include ProfilesMixin(users, audit_entries, state);
  include ProgramsMixin(programs, enrollments, users, audit_entries, state);
  include ActivitiesMixin(activities, programs, users, audit_entries, state);
  include ExperimentsMixin(experiments, users, audit_entries, state);
  include RetroMixin(retro_sessions, activities, users, audit_entries, state);
  include ReportsMixin(activities, reports, programs, enrollments, users, audit_entries);
};
