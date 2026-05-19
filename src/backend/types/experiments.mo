import Common "common";
module {
  public type MetricEntry = {
    name : Text;
    value : Text;
  };

  public type Experiment = {
    id : Common.EntityId;
    user_principal : Common.UserId;
    program_id : ?Common.EntityId;
    hypothesis : Text;
    method : Text;
    results_summary : Text;
    metrics : [MetricEntry];
    outcome : Common.ExperimentOutcome;
    linked_activity_id : ?Common.EntityId;
    created_at : Common.Timestamp;
    updated_at : Common.Timestamp;
  };

  public type CreateExperimentInput = {
    program_id : ?Common.EntityId;
    hypothesis : Text;
    method : Text;
    results_summary : Text;
    metrics : [MetricEntry];
    outcome : Common.ExperimentOutcome;
    linked_activity_id : ?Common.EntityId;
  };
};
