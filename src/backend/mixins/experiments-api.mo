import Int "mo:core/Int";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Common "../types/common";
import ProfileTypes "../types/profiles";
import ExperimentTypes "../types/experiments";
import AuditTypes "../types/audit";
import ProfileLib "../lib/profiles";
import ExperimentLib "../lib/experiments";
import AuditLib "../lib/audit";

mixin (
  experiments : Map.Map<Common.EntityId, ExperimentTypes.Experiment>,
  users : Map.Map<Common.UserId, ProfileTypes.UserProfile>,
  audit_entries : Map.Map<Common.EntityId, AuditTypes.AuditEntry>,
  state : { var next_id : Nat },
) {
  public shared ({ caller }) func create_experiment(
    input : ExperimentTypes.CreateExperimentInput
  ) : async ExperimentTypes.Experiment {
    let caller_id = caller.toText();
    let now : Common.Timestamp = Int.abs(Time.now()).toNat64();
    let _ = ProfileLib.ensureProfile(users, caller_id, now);
    let experiment = ExperimentLib.createExperiment(experiments, caller_id, input, now);
    AuditLib.log(audit_entries, caller_id, "create_experiment", "Experiment", experiment.id, now);
    experiment
  };

  public query ({ caller }) func list_my_experiments() : async [ExperimentTypes.Experiment] {
    let caller_id = caller.toText();
    ExperimentLib.listMyExperiments(experiments, caller_id)
  };

  public shared ({ caller }) func update_experiment(
    id : Common.EntityId,
    input : ExperimentTypes.CreateExperimentInput,
  ) : async ExperimentTypes.Experiment {
    let caller_id = caller.toText();
    let now : Common.Timestamp = Int.abs(Time.now()).toNat64();
    let existing = switch (experiments.get(id)) {
      case (?e) { e };
      case null { Runtime.trap("Experiment not found: " # id) };
    };
    if (existing.user_principal != caller_id) { Runtime.trap("Not authorized") };
    if (input.hypothesis.size() < 10) { Runtime.trap("Hypothesis must be at least 10 characters") };
    if (input.method.size() < 20) { Runtime.trap("Method must be at least 20 characters") };
    let updated = {
      existing with
      program_id = input.program_id;
      hypothesis = input.hypothesis;
      method = input.method;
      results_summary = input.results_summary;
      metrics = input.metrics;
      outcome = input.outcome;
      linked_activity_id = input.linked_activity_id;
      updated_at = now;
    };
    experiments.add(id, updated);
    AuditLib.log(audit_entries, caller_id, "update_experiment", "Experiment", id, now);
    updated
  };
};
