import Common "common";
module {
  public type AuditEntry = {
    id : Common.EntityId;
    actor_principal : Common.UserId;
    action : Text;
    entity_type : Text;
    entity_id : Common.EntityId;
    timestamp : Common.Timestamp;
  };
};
