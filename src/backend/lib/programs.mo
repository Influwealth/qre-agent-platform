import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Common "../types/common";
import ProgramTypes "../types/programs";

module {
  public func listPrograms(
    programs : Map.Map<Common.EntityId, ProgramTypes.RNDProgram>
  ) : [ProgramTypes.RNDProgram] {
    programs.values().filter(func p { p.status == #active }).toArray()
  };

  public func createProgram(
    programs : Map.Map<Common.EntityId, ProgramTypes.RNDProgram>,
    name : Text,
    description : Text,
    irc_section : ?Text,
    now : Common.Timestamp,
  ) : ProgramTypes.RNDProgram {
    let id = "prog-" # Nat.fromNat64(now).toText() # "-" # programs.size().toText();
    let prog : ProgramTypes.RNDProgram = {
      id;
      name;
      description;
      irc_section = switch (irc_section) { case (?s) { s }; case null { "41" } };
      status = #active;
      created_at = now;
      updated_at = now;
    };
    programs.add(id, prog);
    prog
  };

  public func enrollUser(
    enrollments : Map.Map<Common.EntityId, ProgramTypes.Enrollment>,
    programs : Map.Map<Common.EntityId, ProgramTypes.RNDProgram>,
    user_principal : Common.UserId,
    program_id : Common.EntityId,
    now : Common.Timestamp,
  ) : ProgramTypes.Enrollment {
    // Validate program exists
    switch (programs.get(program_id)) {
      case null { Runtime.trap("Program not found: " # program_id) };
      case (?_) {};
    };
    // Check not already enrolled
    let already = enrollments.values().find(func e {
      e.user_principal == user_principal and e.program_id == program_id
    });
    switch (already) {
      case (?_) { Runtime.trap("Already enrolled in program " # program_id) };
      case null {};
    };
    let id = "enroll-" # Nat.fromNat64(now).toText() # "-" # enrollments.size().toText();
    let enrollment : ProgramTypes.Enrollment = {
      id;
      user_principal;
      program_id;
      status = #pending;
      enrolled_at = now;
      reviewed_by = null;
      review_notes = null;
      reviewed_at = null;
    };
    enrollments.add(id, enrollment);
    enrollment
  };

  public func listEnrollments(
    enrollments : Map.Map<Common.EntityId, ProgramTypes.Enrollment>,
    status_filter : ?Common.EnrollmentStatus,
  ) : [ProgramTypes.Enrollment] {
    switch (status_filter) {
      case null { enrollments.values().toArray() };
      case (?s) {
        enrollments.values().filter(func e {
          switch (e.status, s) {
            case (#pending, #pending) { true };
            case (#approved, #approved) { true };
            case (#rejected, #rejected) { true };
            case (_,_) { false };
          }
        }).toArray()
      };
    }
  };

  public func reviewEnrollment(
    enrollments : Map.Map<Common.EntityId, ProgramTypes.Enrollment>,
    id : Common.EntityId,
    reviewer_principal : Common.UserId,
    decision : Common.EnrollmentStatus,
    notes : ?Text,
    now : Common.Timestamp,
  ) : ProgramTypes.Enrollment {
    let existing = switch (enrollments.get(id)) {
      case (?e) { e };
      case null { Runtime.trap("Enrollment not found: " # id) };
    };
    let updated = {
      existing with
      status = decision;
      reviewed_by = ?reviewer_principal;
      review_notes = notes;
      reviewed_at = ?now;
    };
    enrollments.add(id, updated);
    updated
  };
};
