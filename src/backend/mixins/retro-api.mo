import Int "mo:core/Int";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Common "../types/common";
import ProfileTypes "../types/profiles";
import RetroTypes "../types/retro";
import ActivityTypes "../types/activities";
import AuditTypes "../types/audit";
import ProfileLib "../lib/profiles";
import RetroLib "../lib/retro";
import AuditLib "../lib/audit";

mixin (
  retro_sessions : Map.Map<Common.EntityId, RetroTypes.RetroSession>,
  activities : Map.Map<Common.EntityId, ActivityTypes.RDActivity>,
  users : Map.Map<Common.UserId, ProfileTypes.UserProfile>,
  audit_entries : Map.Map<Common.EntityId, AuditTypes.AuditEntry>,
  state : { var next_id : Nat },
) {
  public shared ({ caller }) func start_retro_session(
    input : RetroTypes.CreateRetroSessionInput
  ) : async RetroTypes.RetroSession {
    let caller_id = caller.toText();
    let now : Common.Timestamp = Int.abs(Time.now()).toNat64();
    let _ = ProfileLib.ensureProfile(users, caller_id, now);
    let session = RetroLib.createRetroSession(retro_sessions, caller_id, input, now);
    AuditLib.log(audit_entries, caller_id, "start_retro_session", "RetroSession", session.id, now);
    session
  };

  public shared ({ caller }) func add_retro_message(
    input : RetroTypes.AddRetroMessageInput
  ) : async RetroTypes.RetroSession {
    let caller_id = caller.toText();
    let now : Common.Timestamp = Int.abs(Time.now()).toNat64();
    RetroLib.addRetroMessage(retro_sessions, input, caller_id, now)
  };

  public shared ({ caller }) func complete_retro_session(
    session_id : Common.EntityId
  ) : async RetroTypes.RetroSession {
    let caller_id = caller.toText();
    let now : Common.Timestamp = Int.abs(Time.now()).toNat64();
    let session = RetroLib.completeRetroSession(retro_sessions, activities, session_id, caller_id, now);
    AuditLib.log(audit_entries, caller_id, "complete_retro_session", "RetroSession", session_id, now);
    session
  };

  public query ({ caller }) func list_retro_sessions() : async [RetroTypes.RetroSession] {
    let caller_id = caller.toText();
    retro_sessions.values().filter(func s { s.user_principal == caller_id }).toArray()
  };
};
