import Common "common";
module {
  public type UserProfile = {
    principal_id : Common.UserId;
    role : Common.Role;
    email : ?Text;
    created_at : Common.Timestamp;
    updated_at : Common.Timestamp;
  };

  // Stats counters per user for entanglement/credibility score
  public type UserStats = {
    total_activities : Nat;
    approved_activities : Nat;
    total_hours : Float;
    eligible_hours : Float;
  };
};
