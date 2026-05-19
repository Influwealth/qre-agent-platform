import Common "common";
module {
  public type RNDProgram = {
    id : Common.EntityId;
    name : Text;
    description : Text;
    irc_section : Text;
    status : Common.ProgramStatus;
    created_at : Common.Timestamp;
    updated_at : Common.Timestamp;
  };

  public type Enrollment = {
    id : Common.EntityId;
    user_principal : Common.UserId;
    program_id : Common.EntityId;
    status : Common.EnrollmentStatus;
    enrolled_at : Common.Timestamp;
    reviewed_by : ?Common.UserId;
    review_notes : ?Text;
    reviewed_at : ?Common.Timestamp;
  };
};
