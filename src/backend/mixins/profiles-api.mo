import Int "mo:core/Int";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Common "../types/common";
import ProfileTypes "../types/profiles";
import AuditTypes "../types/audit";
import ProfileLib "../lib/profiles";
import AuditLib "../lib/audit";

mixin (
  users : Map.Map<Common.UserId, ProfileTypes.UserProfile>,
  audit_entries : Map.Map<Common.EntityId, AuditTypes.AuditEntry>,
  state : { var next_id : Nat },
) {
  public query ({ caller }) func get_my_profile() : async ProfileTypes.UserProfile {
    let caller_id = caller.toText();
    switch (ProfileLib.getProfile(users, caller_id)) {
      case (?p) { p };
      case null {
        // Return a default profile representation without mutating (query)
        {
          principal_id = caller_id;
          role = #user;
          email = null;
          created_at = 0;
          updated_at = 0;
        }
      };
    }
  };

  public shared ({ caller }) func upsert_profile(
    email : ?Text
  ) : async ProfileTypes.UserProfile {
    let caller_id = caller.toText();
    let now : Common.Timestamp = Int.abs(Time.now()).toNat64();
    let profile = ProfileLib.ensureProfile(users, caller_id, now);
    let updated = { profile with email; updated_at = now };
    users.add(caller_id, updated);
    AuditLib.log(audit_entries, caller_id, "upsert_profile", "UserProfile", caller_id, now);
    updated
  };

  public query ({ caller }) func admin_list_users() : async [ProfileTypes.UserProfile] {
    let caller_id = caller.toText();
    if (not ProfileLib.isAdmin(users, caller_id)) {
      Runtime.trap("Admin access required")
    };
    ProfileLib.listUsers(users)
  };

  public shared ({ caller }) func admin_set_user_role(
    target_principal : Common.UserId,
    role : Common.Role,
  ) : async ProfileTypes.UserProfile {
    let caller_id = caller.toText();
    if (not ProfileLib.isAdmin(users, caller_id)) {
      Runtime.trap("Admin access required")
    };
    let now : Common.Timestamp = Int.abs(Time.now()).toNat64();
    let updated = ProfileLib.setRole(users, target_principal, role, now);
    AuditLib.log(audit_entries, caller_id, "set_role", "UserProfile", target_principal, now);
    updated
  };

  public query ({ caller }) func get_audit_trail(
    entity_id : Common.EntityId,
    limit : Nat,
  ) : async [AuditTypes.AuditEntry] {
    let caller_id = caller.toText();
    // Allow self audit trail or admin
    if (entity_id != caller_id and not ProfileLib.isAdmin(users, caller_id)) {
      Runtime.trap("Access denied")
    };
    AuditLib.getTrail(audit_entries, entity_id, limit)
  };
};
