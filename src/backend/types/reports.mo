import Common "common";
module {
  public type Report = {
    id : Common.EntityId;
    scope : Common.ReportScope;
    period_start : Text;
    period_end : Text;
    total_hours : Float;
    eligible_hours : Float;
    estimated_qre_value : Float;
    breakdown_eligible : Nat;
    breakdown_borderline : Nat;
    breakdown_ineligible : Nat;
    activity_ids : [Common.EntityId];
    generated_at : Common.Timestamp;
  };

  public type GlobalStats = {
    total_users : Nat;
    total_programs : Nat;
    pending_enrollments : Nat;
    submitted_activities : Nat;
    total_approved_hours : Float;
    global_qre_value : Float;
  };
};
