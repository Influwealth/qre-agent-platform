import Array "mo:core/Array";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Common "../types/common";
import AuditTypes "../types/audit";
import Nat64 "mo:core/Nat64";

module {
  public func log(
    audit_entries : Map.Map<Common.EntityId, AuditTypes.AuditEntry>,
    actor_principal : Common.UserId,
    action : Text,
    entity_type : Text,
    entity_id : Common.EntityId,
    now : Common.Timestamp,
  ) {
    let id = "audit-" # now.toNat().toText() # "-" # audit_entries.size().toText();
    let entry : AuditTypes.AuditEntry = {
      id;
      actor_principal;
      action;
      entity_type;
      entity_id;
      timestamp = now;
    };
    audit_entries.add(id, entry)
  };

  public func getTrail(
    audit_entries : Map.Map<Common.EntityId, AuditTypes.AuditEntry>,
    entity_id : Common.EntityId,
    limit : Nat,
  ) : [AuditTypes.AuditEntry] {
    let all = audit_entries.values()
      .filter(func e { e.entity_id == entity_id })
      .toArray();
    let n = all.size();
    if (n <= limit) { all }
    else { all.sliceToArray<AuditTypes.AuditEntry>(n - limit, n) }
  };

  public func listRecent(
    audit_entries : Map.Map<Common.EntityId, AuditTypes.AuditEntry>,
    limit : Nat,
  ) : [AuditTypes.AuditEntry] {
    let all = audit_entries.values().toArray();
    let n = all.size();
    if (n <= limit) { all }
    else { all.sliceToArray<AuditTypes.AuditEntry>(n - limit, n) }
  };
};
