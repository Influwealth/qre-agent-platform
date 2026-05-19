import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Common "../types/common";
import ActivityTypes "../types/activities";
import Nat64 "mo:core/Nat64";

module {
  public func createActivity(
    activities : Map.Map<Common.EntityId, ActivityTypes.RDActivity>,
    user_principal : Common.UserId,
    input : ActivityTypes.CreateActivityInput,
    classification : ActivityTypes.ClassificationResult,
    now : Common.Timestamp,
  ) : ActivityTypes.RDActivity {
    let id = "act-" # now.toNat().toText() # "-" # activities.size().toText();
    let activity : ActivityTypes.RDActivity = {
      id;
      user_principal;
      program_id = input.program_id;
      title = input.title;
      description = input.description;
      activity_type = input.activity_type;
      start_date = input.start_date;
      end_date = input.end_date;
      hours_spent = input.hours_spent;
      tags = input.tags;
      eligibility_score = classification.eligibility_score;
      eligibility_label = classification.eligibility_label;
      four_part_test_result = classification.four_part_test;
      quantum_adjusted_score = classification.quantum_adjusted_score;
      agent_reasoning = classification.agent_reasoning;
      status = #submitted;
      admin_notes = null;
      content_hash = "";
      created_at = now;
      updated_at = now;
    };
    activities.add(id, activity);
    activity
  };

  public func listMyActivities(
    activities : Map.Map<Common.EntityId, ActivityTypes.RDActivity>,
    user_principal : Common.UserId,
    status_filter : ?Common.ActivityStatus,
    program_id_filter : ?Common.EntityId,
  ) : [ActivityTypes.RDActivity] {
    activities.values().filter(func a {
      let user_match = a.user_principal == user_principal;
      let status_match = switch (status_filter) {
        case null { true };
        case (?s) {
          switch (a.status, s) {
            case (#draft, #draft) { true };
            case (#submitted, #submitted) { true };
            case (#approved, #approved) { true };
            case (#rejected, #rejected) { true };
            case (_,_) { false };
          }
        };
      };
      let prog_match = switch (program_id_filter) {
        case null { true };
        case (?pid) {
          switch (a.program_id) {
            case (?ap) { ap == pid };
            case null { false };
          }
        };
      };
      user_match and status_match and prog_match
    }).toArray()
  };

  public func adminListActivities(
    activities : Map.Map<Common.EntityId, ActivityTypes.RDActivity>,
    user_principal_filter : ?Common.UserId,
    status_filter : ?Common.ActivityStatus,
    program_id_filter : ?Common.EntityId,
  ) : [ActivityTypes.RDActivity] {
    activities.values().filter(func a {
      let user_match = switch (user_principal_filter) {
        case null { true };
        case (?uid) { a.user_principal == uid };
      };
      let status_match = switch (status_filter) {
        case null { true };
        case (?s) {
          switch (a.status, s) {
            case (#draft, #draft) { true };
            case (#submitted, #submitted) { true };
            case (#approved, #approved) { true };
            case (#rejected, #rejected) { true };
            case (_,_) { false };
          }
        };
      };
      let prog_match = switch (program_id_filter) {
        case null { true };
        case (?pid) {
          switch (a.program_id) {
            case (?ap) { ap == pid };
            case null { false };
          }
        };
      };
      user_match and status_match and prog_match
    }).toArray()
  };

  public func reviewActivity(
    activities : Map.Map<Common.EntityId, ActivityTypes.RDActivity>,
    id : Common.EntityId,
    reviewer_principal : Common.UserId,
    decision : Common.ActivityStatus,
    notes : ?Text,
    now : Common.Timestamp,
  ) : ActivityTypes.RDActivity {
    let existing = switch (activities.get(id)) {
      case (?a) { a };
      case null { Runtime.trap("Activity not found: " # id) };
    };
    let _ = reviewer_principal; // reviewer logged at mixin layer
    let updated = { existing with status = decision; admin_notes = notes; updated_at = now };
    activities.add(id, updated);
    updated
  };

  public func userActivityContext(
    activities : Map.Map<Common.EntityId, ActivityTypes.RDActivity>,
    user_principal : Common.UserId,
  ) : ActivityTypes.UserActivityContext {
    var total = 0;
    var approved = 0;
    activities.values().forEach(func a {
      if (a.user_principal == user_principal) {
        total += 1;
        if (a.status == #approved) { approved += 1 };
      }
    });
    { approved_count = approved; total_count = total }
  };
};
