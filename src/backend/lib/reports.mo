import Float "mo:core/Float";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Common "../types/common";
import ReportTypes "../types/reports";
import ActivityTypes "../types/activities";

module {
  // Simple ISO date prefix comparison: "2024-01-15" >= "2024-01-01"
  func dateInRange(date : Text, start : Text, end_date : Text) : Bool {
    date >= start and date <= end_date
  };

  func buildReport(
    id : Text,
    scope : Common.ReportScope,
    acts : [ActivityTypes.RDActivity],
    period_start : Text,
    period_end : Text,
    now : Common.Timestamp,
  ) : ReportTypes.Report {
    var total_hours : Float = 0.0;
    var eligible_hours : Float = 0.0;
    var eligible_count : Nat = 0;
    var borderline_count : Nat = 0;
    var ineligible_count : Nat = 0;
    let act_ids_list = List.empty<Common.EntityId>();

    for (a in acts.values()) {
      total_hours += a.hours_spent;
      switch (a.eligibility_label) {
        case (#eligible) {
          eligible_hours += a.hours_spent;
          eligible_count += 1;
        };
        case (#borderline) { borderline_count += 1 };
        case (#ineligible) { ineligible_count += 1 };
      };
      act_ids_list.add(a.id);
    };

    {
      id;
      scope;
      period_start;
      period_end;
      total_hours;
      eligible_hours;
      estimated_qre_value = eligible_hours * 150.0;
      breakdown_eligible = eligible_count;
      breakdown_borderline = borderline_count;
      breakdown_ineligible = ineligible_count;
      activity_ids = act_ids_list.toArray();
      generated_at = now;
    }
  };

  public func generateUserReport(
    activities : Map.Map<Common.EntityId, ActivityTypes.RDActivity>,
    reports : Map.Map<Common.EntityId, ReportTypes.Report>,
    user_principal : Common.UserId,
    period_start : Text,
    period_end : Text,
    now : Common.Timestamp,
  ) : ReportTypes.Report {
    let acts = activities.values().filter(func a {
      a.user_principal == user_principal and
      a.status == #approved and
      dateInRange(a.start_date, period_start, period_end)
    }).toArray();
    let id = "rep-" # Nat.fromNat64(now).toText() # "-" # user_principal;
    let report = buildReport(id, #user, acts, period_start, period_end, now);
    reports.add(id, report);
    report
  };

  public func generateGlobalReport(
    activities : Map.Map<Common.EntityId, ActivityTypes.RDActivity>,
    reports : Map.Map<Common.EntityId, ReportTypes.Report>,
    period_start : Text,
    period_end : Text,
    now : Common.Timestamp,
  ) : ReportTypes.Report {
    let acts = activities.values().filter(func a {
      a.status == #approved and
      dateInRange(a.start_date, period_start, period_end)
    }).toArray();
    let id = "rep-global-" # Nat.fromNat64(now).toText();
    let report = buildReport(id, #global, acts, period_start, period_end, now);
    reports.add(id, report);
    report
  };

  public func exportReportCsv(
    reports : Map.Map<Common.EntityId, ReportTypes.Report>,
    activities : Map.Map<Common.EntityId, ActivityTypes.RDActivity>,
    report_id : Common.EntityId,
  ) : Text {
    let report = switch (reports.get(report_id)) {
      case (?r) { r };
      case null { Runtime.trap("Report not found: " # report_id) };
    };

    var csv = "user_principal,title,activity_type,start_date,end_date,hours_spent,eligibility_label,quantum_adjusted_score,four_part_passed_count,estimated_qre_contribution,status,content_hash\n";

    for (act_id in report.activity_ids.values()) {
      switch (activities.get(act_id)) {
        case (?a) {
          let atype = switch (a.activity_type) { case (#retroactive) { "retroactive" }; case (#ongoing) { "ongoing" } };
          let eligibilityLbl = switch (a.eligibility_label) { case (#eligible) { "eligible" }; case (#borderline) { "borderline" }; case (#ineligible) { "ineligible" } };
          let status_str = switch (a.status) { case (#draft) { "draft" }; case (#submitted) { "submitted" }; case (#approved) { "approved" }; case (#rejected) { "rejected" } };
          let parts_passed : Nat =
            (if (a.four_part_test_result.permitted_purpose) { 1 } else { 0 }) +
            (if (a.four_part_test_result.technological_in_nature) { 1 } else { 0 }) +
            (if (a.four_part_test_result.elimination_of_uncertainty) { 1 } else { 0 }) +
            (if (a.four_part_test_result.process_of_experimentation) { 1 } else { 0 });
          let qre_contrib = (switch (a.eligibility_label) { case (#eligible) { a.hours_spent * 150.0 }; case _ { 0.0 } });
          let end_date_str = switch (a.end_date) { case (?d) { d }; case null { "" } };
          // sanitize: remove commas/newlines from text fields
          let safe = func(t : Text) : Text {
            t.replace(#char ',', " ").replace(#char '\n', " ");
          };
          csv #= safe(a.user_principal) # "," #
            safe(a.title) # "," #
            atype # "," #
            a.start_date # "," #
            end_date_str # "," #
            debug_show(a.hours_spent) # "," #
            eligibilityLbl # "," #
            debug_show(a.quantum_adjusted_score) # "," #
            parts_passed.toText() # "," #
            debug_show(qre_contrib) # "," #
            status_str # "," #
            safe(a.content_hash) # "\n";
        };
        case null {};
      }
    };
    csv
  };

  public func globalStats(
    users : Nat,
    programs : Nat,
    enrollments : Map.Map<Common.EntityId, { status : Common.EnrollmentStatus }>,
    activities : Map.Map<Common.EntityId, ActivityTypes.RDActivity>,
  ) : ReportTypes.GlobalStats {
    var pending_enrollments : Nat = 0;
    var submitted_activities : Nat = 0;
    var total_approved_hours : Float = 0.0;

    enrollments.values().forEach(func e {
      if (e.status == #pending) { pending_enrollments += 1 };
    });
    activities.values().forEach(func a {
      if (a.status == #submitted) { submitted_activities += 1 };
      if (a.status == #approved and a.eligibility_label == #eligible) {
        total_approved_hours += a.hours_spent;
      };
    });

    {
      total_users = users;
      total_programs = programs;
      pending_enrollments;
      submitted_activities;
      total_approved_hours;
      global_qre_value = total_approved_hours * 150.0;
    }
  };
};
