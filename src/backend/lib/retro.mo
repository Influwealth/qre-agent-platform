import Array "mo:core/Array";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Common "../types/common";
import RetroTypes "../types/retro";
import ActivityTypes "../types/activities";

module {
  // Returns the next question to guide the retro session based on conversation step
  func nextQuestion(step : Nat) : Text {
    switch (step) {
      case 0 { "What time period are we capturing for your R&D activities?" };
      case 1 { "Please list your major technical projects during that period." };
      case 2 { "For each project, was there a technical problem you weren't sure how to solve? Describe the uncertainty." };
      case 3 { "What methods or experiments did you try to address those challenges?" };
      case 4 { "What was the outcome of those experiments?" };
      case 5 { "Approximately how many hours did you spend on this research?" };
      case _ { "Thank you for that information. Are there additional projects or activities to capture? If not, we can finalize the session." };
    }
  };

  public func createRetroSession(
    sessions : Map.Map<Common.EntityId, RetroTypes.RetroSession>,
    user_principal : Common.UserId,
    input : RetroTypes.CreateRetroSessionInput,
    now : Common.Timestamp,
  ) : RetroTypes.RetroSession {
    let id = "retro-" # Nat.fromNat64(now).toText() # "-" # sessions.size().toText();
    let first_q : RetroTypes.ConversationEntry = {
      role = "assistant";
      content = nextQuestion(0);
      timestamp = now;
    };
    let session : RetroTypes.RetroSession = {
      id;
      user_principal;
      time_range_start = input.time_range_start;
      time_range_end = input.time_range_end;
      status = #active;
      conversation = [first_q];
      candidate_activities = [];
      created_at = now;
      updated_at = now;
    };
    sessions.add(id, session);
    session
  };

  public func addRetroMessage(
    sessions : Map.Map<Common.EntityId, RetroTypes.RetroSession>,
    input : RetroTypes.AddRetroMessageInput,
    user_principal : Common.UserId,
    now : Common.Timestamp,
  ) : RetroTypes.RetroSession {
    let existing = switch (sessions.get(input.session_id)) {
      case (?s) { s };
      case null { Runtime.trap("Session not found: " # input.session_id) };
    };
    if (existing.user_principal != user_principal) {
      Runtime.trap("Not authorized to modify this session")
    };
    if (existing.status != #active) {
      Runtime.trap("Session is not active")
    };

    // Append the user message
    let user_entry : RetroTypes.ConversationEntry = {
      role = input.role;
      content = input.content;
      timestamp = now;
    };

    // Generate next assistant question based on current step count
    let user_messages = existing.conversation.filter(func e { e.role == "user" });
    let next_step = user_messages.size() + 1; // +1 because we're adding one now
    let assistant_entry : RetroTypes.ConversationEntry = {
      role = "assistant";
      content = nextQuestion(next_step);
      timestamp = now;
    };

    let new_conversation = existing.conversation
      .concat([user_entry])
      .concat([assistant_entry]);

    let updated = { existing with conversation = new_conversation; updated_at = now };
    sessions.add(input.session_id, updated);
    updated
  };

  public func completeRetroSession(
    sessions : Map.Map<Common.EntityId, RetroTypes.RetroSession>,
    activities : Map.Map<Common.EntityId, ActivityTypes.RDActivity>,
    session_id : Common.EntityId,
    user_principal : Common.UserId,
    now : Common.Timestamp,
  ) : RetroTypes.RetroSession {
    let existing = switch (sessions.get(session_id)) {
      case (?s) { s };
      case null { Runtime.trap("Session not found: " # session_id) };
    };
    if (existing.user_principal != user_principal) {
      Runtime.trap("Not authorized")
    };

    // Store all candidate activities in the activities map
    for (act in existing.candidate_activities.values()) {
      activities.add(act.id, act);
    };

    let completed = { existing with status = #completed; updated_at = now };
    sessions.add(session_id, completed);
    completed
  };
};
