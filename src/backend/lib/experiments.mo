import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Common "../types/common";
import ExperimentTypes "../types/experiments";

module {
  public func createExperiment(
    experiments : Map.Map<Common.EntityId, ExperimentTypes.Experiment>,
    user_principal : Common.UserId,
    input : ExperimentTypes.CreateExperimentInput,
    now : Common.Timestamp,
  ) : ExperimentTypes.Experiment {
    if (input.hypothesis.size() < 10) {
      Runtime.trap("Hypothesis must be at least 10 characters")
    };
    if (input.method.size() < 20) {
      Runtime.trap("Method must be at least 20 characters")
    };
    let id = "exp-" # Nat.fromNat64(now).toText() # "-" # experiments.size().toText();
    let experiment : ExperimentTypes.Experiment = {
      id;
      user_principal;
      program_id = input.program_id;
      hypothesis = input.hypothesis;
      method = input.method;
      results_summary = input.results_summary;
      metrics = input.metrics;
      outcome = input.outcome;
      linked_activity_id = input.linked_activity_id;
      created_at = now;
      updated_at = now;
    };
    experiments.add(id, experiment);
    experiment
  };

  public func listMyExperiments(
    experiments : Map.Map<Common.EntityId, ExperimentTypes.Experiment>,
    user_principal : Common.UserId,
  ) : [ExperimentTypes.Experiment] {
    experiments.values().filter(func e {
      e.user_principal == user_principal
    }).toArray()
  };
};
