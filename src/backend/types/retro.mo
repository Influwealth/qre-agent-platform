import Activities "activities";
import Common "common";
module {
  public type ConversationEntry = {
    role : Text;
    content : Text;
    timestamp : Common.Timestamp;
  };

  public type RetroSession = {
    id : Common.EntityId;
    user_principal : Common.UserId;
    time_range_start : Text; // ISO date
    time_range_end : Text;
    status : Common.RetroSessionStatus;
    conversation : [ConversationEntry];
    candidate_activities : [Activities.RDActivity];
    created_at : Common.Timestamp;
    updated_at : Common.Timestamp;
  };

  public type CreateRetroSessionInput = {
    time_range_start : Text;
    time_range_end : Text;
  };

  public type AddRetroMessageInput = {
    session_id : Common.EntityId;
    role : Text;
    content : Text;
  };
};
