import Float "mo:core/Float";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Common "../types/common";
import ProfileTypes "../types/profiles";

module {
  public func ensureProfile(
    users : Map.Map<Common.UserId, ProfileTypes.UserProfile>,
    caller : Common.UserId,
    now : Common.Timestamp,
  ) : ProfileTypes.UserProfile {
    switch (users.get(caller)) {
      case (?p) { p };
      case null {
        let profile : ProfileTypes.UserProfile = {
          principal_id = caller;
          role = #user;
          email = null;
          created_at = now;
          updated_at = now;
        };
        users.add(caller, profile);
        profile
      };
    }
  };

  public func getProfile(
    users : Map.Map<Common.UserId, ProfileTypes.UserProfile>,
    principal_id : Common.UserId,
  ) : ?ProfileTypes.UserProfile {
    users.get(principal_id)
  };

  public func setRole(
    users : Map.Map<Common.UserId, ProfileTypes.UserProfile>,
    target_principal : Common.UserId,
    role : Common.Role,
    now : Common.Timestamp,
  ) : ProfileTypes.UserProfile {
    let existing = switch (users.get(target_principal)) {
      case (?p) { p };
      case null { Runtime.trap("User not found: " # target_principal) };
    };
    let updated = { existing with role; updated_at = now };
    users.add(target_principal, updated);
    updated
  };

  public func isAdmin(
    users : Map.Map<Common.UserId, ProfileTypes.UserProfile>,
    principal_id : Common.UserId,
  ) : Bool {
    switch (users.get(principal_id)) {
      case (?p) { p.role == #admin };
      case null { false };
    }
  };

  public func listUsers(
    users : Map.Map<Common.UserId, ProfileTypes.UserProfile>
  ) : [ProfileTypes.UserProfile] {
    users.values().toArray()
  };

  public func credibilityScore(
    approved_count : Nat,
    total_count : Nat,
  ) : Float {
    if (total_count == 0) { 0.0 }
    else { approved_count.toFloat() / total_count.toFloat() }
  };
};
