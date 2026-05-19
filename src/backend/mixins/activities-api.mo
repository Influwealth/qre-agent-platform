import Int "mo:core/Int";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Common "../types/common";
import ProfileTypes "../types/profiles";
import ActivityTypes "../types/activities";
import ProgramTypes "../types/programs";
import AuditTypes "../types/audit";
import ProfileLib "../lib/profiles";
import ActivityLib "../lib/activities";
import Classifier "../lib/classifier";
import AuditLib "../lib/audit";

mixin (
  activities : Map.Map<Common.EntityId, ActivityTypes.RDActivity>,
  programs : Map.Map<Common.EntityId, ProgramTypes.RNDProgram>,
  users : Map.Map<Common.UserId, ProfileTypes.UserProfile>,
  audit_entries : Map.Map<Common.EntityId, AuditTypes.AuditEntry>,
  state : { var next_id : Nat },
) {
  public shared ({ caller }) func create_activity(
    input : ActivityTypes.CreateActivityInput
  ) : async ActivityTypes.CreateActivityResult {
    let caller_id = caller.toText();
    // Validation
    if (input.title.size() < 10) { Runtime.trap("Title must be at least 10 characters") };
    if (input.description.size() < 50) { Runtime.trap("Description must be at least 50 characters") };
    if (input.hours_spent <= 0.0 or input.hours_spent > 9999.0) { Runtime.trap("Hours must be positive and at most 9999") };

    let now : Common.Timestamp = Int.abs(Time.now()).toNat64();
    // Ensure profile exists
    let _ = ProfileLib.ensureProfile(users, caller_id, now);

    // Get user context for quantum score
    let ctx = ActivityLib.userActivityContext(activities, caller_id);
    let classification = Classifier.classify(
      input.title, input.description, input.hours_spent,
      ctx.approved_count, ctx.total_count
    );
    // Compute content hash
    let content_hash = Classifier.computeContentHash(input.title, input.description, input.hours_spent);

    let activity = ActivityLib.createActivity(activities, caller_id, input, classification, now);
    // Patch content_hash into the stored record
    let with_hash = { activity with content_hash };
    activities.add(activity.id, with_hash);

    AuditLib.log(audit_entries, caller_id, "create_activity", "RDActivity", activity.id, now);
    { activity = with_hash; classification }
  };

  public query ({ caller }) func list_my_activities(
    status_filter : ?Common.ActivityStatus,
    program_id_filter : ?Common.EntityId,
  ) : async [ActivityTypes.RDActivity] {
    let caller_id = caller.toText();
    ActivityLib.listMyActivities(activities, caller_id, status_filter, program_id_filter)
  };

  public query ({ caller }) func admin_list_activities(
    user_principal_filter : ?Common.UserId,
    status_filter : ?Common.ActivityStatus,
    program_id_filter : ?Common.EntityId,
  ) : async [ActivityTypes.RDActivity] {
    let caller_id = caller.toText();
    if (not ProfileLib.isAdmin(users, caller_id)) {
      Runtime.trap("Admin access required")
    };
    ActivityLib.adminListActivities(activities, user_principal_filter, status_filter, program_id_filter)
  };

  public shared ({ caller }) func admin_review_activity(
    id : Common.EntityId,
    decision : Common.ActivityStatus,
    notes : ?Text,
  ) : async ActivityTypes.RDActivity {
    let caller_id = caller.toText();
    if (not ProfileLib.isAdmin(users, caller_id)) {
      Runtime.trap("Admin access required")
    };
    let now : Common.Timestamp = Int.abs(Time.now()).toNat64();
    let updated = ActivityLib.reviewActivity(activities, id, caller_id, decision, notes, now);
    AuditLib.log(audit_entries, caller_id, "review_activity", "RDActivity", id, now);
    updated
  };
};
