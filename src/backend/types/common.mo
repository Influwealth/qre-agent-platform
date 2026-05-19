// Cross-cutting types shared across all QRE domains
module {
  public type UserId = Text; // principal.toText()
  public type Timestamp = Nat64; // ICP nanosecond sovereign timestamp
  public type EntityId = Text;

  public type Role = { #user; #admin };

  public type EnrollmentStatus = { #pending; #approved; #rejected };

  public type ActivityStatus = { #draft; #submitted; #approved; #rejected };

  public type ActivityType = { #retroactive; #ongoing };

  public type EligibilityLabel = { #eligible; #borderline; #ineligible };

  public type ExperimentOutcome = { #success; #failure; #inconclusive };

  public type RetroSessionStatus = { #active; #completed };

  public type ProgramStatus = { #active; #inactive };

  public type ReportScope = { #user; #global };

  public type Recommendation = { #approve; #reject; #more_info };
};
