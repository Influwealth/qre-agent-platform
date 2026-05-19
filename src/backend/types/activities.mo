import Common "common";
module {
  public type FourPartTestResult = {
    permitted_purpose : Bool;
    technological_in_nature : Bool;
    elimination_of_uncertainty : Bool;
    process_of_experimentation : Bool;
    notes : Text;
  };

  public type AdminSuggestion = {
    recommendation : Common.Recommendation;
    confidence : Nat; // percentage 0-100
    notes : Text;
  };

  public type ClassificationResult = {
    eligibility_score : Float;
    quantum_adjusted_score : Float;
    eligibility_label : Common.EligibilityLabel;
    four_part_test : FourPartTestResult;
    suggested_tags : [Text];
    agent_reasoning : Text;
    admin_suggestion : AdminSuggestion;
  };

  public type RDActivity = {
    id : Common.EntityId;
    user_principal : Common.UserId;
    program_id : ?Common.EntityId;
    title : Text;
    description : Text;
    activity_type : Common.ActivityType;
    start_date : Text; // ISO date
    end_date : ?Text;
    hours_spent : Float;
    tags : [Text];
    eligibility_score : Float;
    eligibility_label : Common.EligibilityLabel;
    four_part_test_result : FourPartTestResult;
    quantum_adjusted_score : Float;
    agent_reasoning : Text;
    status : Common.ActivityStatus;
    admin_notes : ?Text;
    content_hash : Text; // SHA-256 of title+description+hours
    created_at : Common.Timestamp;
    updated_at : Common.Timestamp;
  };

  public type CreateActivityInput = {
    title : Text;
    description : Text;
    activity_type : Common.ActivityType;
    start_date : Text;
    end_date : ?Text;
    hours_spent : Float;
    program_id : ?Common.EntityId;
    tags : [Text];
  };

  public type CreateActivityResult = {
    activity : RDActivity;
    classification : ClassificationResult;
  };

  // Context used by classifier for quantum score
  public type UserActivityContext = {
    approved_count : Nat;
    total_count : Nat;
  };
};
