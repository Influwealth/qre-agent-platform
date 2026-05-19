import Int "mo:core/Int";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Common "../types/common";
import ProfileTypes "../types/profiles";
import ProgramTypes "../types/programs";
import AuditTypes "../types/audit";
import ProfileLib "../lib/profiles";
import ProgramLib "../lib/programs";
import AuditLib "../lib/audit";
import Nat "mo:core/Nat";

mixin (
  programs : Map.Map<Common.EntityId, ProgramTypes.RNDProgram>,
  enrollments : Map.Map<Common.EntityId, ProgramTypes.Enrollment>,
  users : Map.Map<Common.UserId, ProfileTypes.UserProfile>,
  audit_entries : Map.Map<Common.EntityId, AuditTypes.AuditEntry>,
  state : { var next_id : Nat },
) {
  public query func list_programs() : async [ProgramTypes.RNDProgram] {
    ProgramLib.listPrograms(programs)
  };

  public shared ({ caller }) func admin_create_program(
    name : Text,
    description : Text,
    irc_section : ?Text,
  ) : async ProgramTypes.RNDProgram {
    let caller_id = caller.toText();
    if (not ProfileLib.isAdmin(users, caller_id)) {
      Runtime.trap("Admin access required")
    };
    let now : Common.Timestamp = Int.abs(Time.now()).toNat64();
    let prog = ProgramLib.createProgram(programs, name, description, irc_section, now);
    AuditLib.log(audit_entries, caller_id, "create_program", "RNDProgram", prog.id, now);
    prog
  };

  public shared ({ caller }) func enroll_in_program(
    program_id : Common.EntityId
  ) : async ProgramTypes.Enrollment {
    let caller_id = caller.toText();
    let now : Common.Timestamp = Int.abs(Time.now()).toNat64();
    let enrollment = ProgramLib.enrollUser(enrollments, programs, caller_id, program_id, now);
    AuditLib.log(audit_entries, caller_id, "enroll", "Enrollment", enrollment.id, now);
    enrollment
  };

  public query ({ caller }) func admin_list_enrollments(
    status_filter : ?Common.EnrollmentStatus
  ) : async [ProgramTypes.Enrollment] {
    let caller_id = caller.toText();
    if (not ProfileLib.isAdmin(users, caller_id)) {
      Runtime.trap("Admin access required")
    };
    ProgramLib.listEnrollments(enrollments, status_filter)
  };

  public shared ({ caller }) func admin_review_enrollment(
    id : Common.EntityId,
    decision : Common.EnrollmentStatus,
    notes : ?Text,
  ) : async ProgramTypes.Enrollment {
    let caller_id = caller.toText();
    if (not ProfileLib.isAdmin(users, caller_id)) {
      Runtime.trap("Admin access required")
    };
    let now : Common.Timestamp = Int.abs(Time.now()).toNat64();
    let updated = ProgramLib.reviewEnrollment(enrollments, id, caller_id, decision, notes, now);
    AuditLib.log(audit_entries, caller_id, "review_enrollment", "Enrollment", id, now);
    updated
  };
};
