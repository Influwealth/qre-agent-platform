// IRC §41 deterministic keyword-based scoring engine
import Array "mo:core/Array";
import Char "mo:core/Char";
import Float "mo:core/Float";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Nat32 "mo:core/Nat32";
import Text "mo:core/Text";
import Activities "../types/activities";
import Common "../types/common";

module {

  // ─── Helpers ────────────────────────────────────────────────────────────────

  // Count how many keywords from the list appear (case-insensitive) in the haystack
  func countKeywords(haystack : Text, keywords : [Text]) : Nat {
    let lower = haystack.toLower();
    keywords.foldLeft<Text, Nat>(0, func(acc, kw) {
      if (lower.contains(#text kw)) { acc + 1 } else { acc }
    })
  };

  func floatClamp(v : Float, lo : Float, hi : Float) : Float {
    if (v < lo) { lo } else if (v > hi) { hi } else { v }
  };

  // djb2 hash — deterministic, pure Motoko, returns hex string
  public func computeContentHash(title : Text, description : Text, hours_spent : Float) : Text {
    let raw = title # description # debug_show(hours_spent);
    var h : Nat = 5381;
    for (c in raw.toIter()) {
      // h = h * 33 + char_code
      h := (h * 33 + c.toNat32().toNat()) % 0x100000000;
    };
    // produce 8-hex-char string
    let hex_chars = "0123456789abcdef";
    let hex_arr = hex_chars.toArray();
    var result = "";
    var v = h;
    var i = 0;
    while (i < 8) {
      let nibble = v % 16;
      let ch = Text.fromChar(hex_arr[nibble]);
      result := ch # result;
      v := v / 16;
      i += 1;
    };
    result
  };

  // ─── IRC §41 Four-Part Test ──────────────────────────────────────────────────

  public func runFourPartTest(
    title : Text,
    description : Text,
  ) : Activities.FourPartTestResult {
    let combined = title # " " # description;

    let pp_count = countKeywords(combined, ["new", "improve", "build", "develop", "create", "system", "software", "platform", "prototype"]);
    let tin_count = countKeywords(combined, ["code", "algorithm", "ai", "machine learning", "blockchain", "api", "database", "canister", "icp", "quantum", "data", "compute"]);
    let eu_count = countKeywords(combined, ["uncertain", "problem", "challenge", "research", "explore", "test", "debug", "investigate", "figure out"]);
    let pe_count = countKeywords(combined, ["experiment", "iterate", "prototype", "trial", "benchmark", "validate", "proof of concept", "version", "refine"]);

    let pp = pp_count >= 2;
    let tin = tin_count >= 2;
    let eu = eu_count >= 1;
    let pe = pe_count >= 1;

    var notes = "";
    if (pp) { notes #= "Permitted Purpose: PASS (" # pp_count.toText() # " keywords). " } else { notes #= "Permitted Purpose: FAIL (" # pp_count.toText() # "/2 keywords). " };
    if (tin) { notes #= "Technological in Nature: PASS (" # tin_count.toText() # " keywords). " } else { notes #= "Technological in Nature: FAIL (" # tin_count.toText() # "/2 keywords). " };
    if (eu) { notes #= "Elimination of Uncertainty: PASS. " } else { notes #= "Elimination of Uncertainty: FAIL (no uncertainty keywords). " };
    if (pe) { notes #= "Process of Experimentation: PASS." } else { notes #= "Process of Experimentation: FAIL (no experimentation keywords)." };

    {
      permitted_purpose = pp;
      technological_in_nature = tin;
      elimination_of_uncertainty = eu;
      process_of_experimentation = pe;
      notes;
    }
  };

  // ─── Classical Score ─────────────────────────────────────────────────────────

  public func classicalScore(
    test : Activities.FourPartTestResult,
    description : Text,
    hours_spent : Float,
  ) : Float {
    let parts_passed : Nat =
      (if (test.permitted_purpose) { 1 } else { 0 }) +
      (if (test.technological_in_nature) { 1 } else { 0 }) +
      (if (test.elimination_of_uncertainty) { 1 } else { 0 }) +
      (if (test.process_of_experimentation) { 1 } else { 0 });

    var score : Float = (parts_passed.toFloat() / 4.0) * 80.0;

    let lower = description.toLower();
    if (lower.contains(#text "hypothesis")) { score += 5.0 };
    if (lower.contains(#text "results")) { score += 5.0 };
    if (lower.contains(#text "novel")) { score += 5.0 };
    if (hours_spent >= 10.0) { score += 5.0 };

    // Penalties
    let penalty_words = ["routine", "maintenance", "clerical", "admin", "marketing"];
    let has_penalty = penalty_words.any(func kw { lower.contains(#text kw) });
    if (has_penalty) { score -= 15.0 };
    if (hours_spent > 320.0) { score -= 10.0 };

    floatClamp(score, 0.0, 100.0)
  };

  // ─── Quantum-Adjusted Score ───────────────────────────────────────────────────

  public func quantumAdjustedScore(
    classical : Float,
    description : Text,
    approved_count : Nat,
    total_count : Nat,
  ) : Float {
    let entanglement : Float =
      if (total_count == 0) { 0.0 }
      else { approved_count.toFloat() / total_count.toFloat() };

    var score = classical + (entanglement * 10.0);

    let lower = description.toLower();
    let boost_words = ["quantum", "distributed", "novel", "theorem"];
    let has_boost = boost_words.any(func kw { lower.contains(#text kw) });
    if (has_boost) { score += 3.0 };

    let drag_words = ["routine", "standard", "typical"];
    let has_drag = drag_words.any(func kw { lower.contains(#text kw) });
    if (has_drag) { score -= 3.0 };

    floatClamp(score, 0.0, 100.0)
  };

  // ─── Eligibility Label ───────────────────────────────────────────────────────

  func eligibilityLabel(quantum_adjusted : Float) : Common.EligibilityLabel {
    if (quantum_adjusted >= 80.0) { #eligible }
    else if (quantum_adjusted >= 50.0) { #borderline }
    else { #ineligible }
  };

  // ─── Auto-Tagging ────────────────────────────────────────────────────────────

  public func autoTag(title : Text, description : Text) : [Text] {
    let combined = (title # " " # description).toLower();
    let tags_list = List.empty<Text>();

    if (["ml", "neural", "ai", "llm", "inference", "training"].any<Text>(func kw { combined.contains(#text kw) })) { tags_list.add("ML/AI Research") };
    if (["prototype", "poc", "mvp", "pilot"].any<Text>(func kw { combined.contains(#text kw) })) { tags_list.add("Prototype Development") };
    if (["algorithm", "complexity", "graph", "heuristic"].any<Text>(func kw { combined.contains(#text kw) })) { tags_list.add("Algorithm Design") };
    if (["architecture", "microservice", "distributed", "canister", "icp"].any<Text>(func kw { combined.contains(#text kw) })) { tags_list.add("System Architecture") };
    if (["blockchain", "smart contract", "token", "wallet", "stablecoin"].any<Text>(func kw { combined.contains(#text kw) })) { tags_list.add("Blockchain/Web3 R&D") };
    if (["test", "benchmark", "validate", "qa"].any<Text>(func kw { combined.contains(#text kw) })) { tags_list.add("Testing & Validation") };
    if (["quantum", "qubit", "qudit", "amplitude", "circuit", "superposition"].any<Text>(func kw { combined.contains(#text kw) })) { tags_list.add("Quantum Computing R&D") };
    if (["security", "encrypt", "cryptograph", "auth", "vulnerability"].any<Text>(func kw { combined.contains(#text kw) })) { tags_list.add("Security Research") };
    if (["performance", "latency", "throughput", "optimize"].any<Text>(func kw { combined.contains(#text kw) })) { tags_list.add("Performance Optimization") };

    tags_list.toArray()
  };

  // ─── Admin Suggestion ────────────────────────────────────────────────────────

  public func adminSuggestion(
    test : Activities.FourPartTestResult,
    quantum_adjusted : Float,
  ) : Activities.AdminSuggestion {
    let parts_passed : Nat =
      (if (test.permitted_purpose) { 1 } else { 0 }) +
      (if (test.technological_in_nature) { 1 } else { 0 }) +
      (if (test.elimination_of_uncertainty) { 1 } else { 0 }) +
      (if (test.process_of_experimentation) { 1 } else { 0 });

    let (recommendation, confidence) : (Common.Recommendation, Nat) =
      if (parts_passed == 4 and quantum_adjusted >= 80.0) { (#approve, 90) }
      else if (parts_passed >= 3 and quantum_adjusted >= 60.0) { (#approve, 70) }
      else if (parts_passed >= 2 and quantum_adjusted >= 50.0) { (#more_info, 60) }
      else { (#reject, 80) };

    { recommendation; confidence; notes = test.notes }
  };

  // ─── Full Classification Pipeline ─────────────────────────────────────────────

  public func classify(
    title : Text,
    description : Text,
    hours_spent : Float,
    approved_count : Nat,
    total_count : Nat,
  ) : Activities.ClassificationResult {
    let test = runFourPartTest(title, description);
    let classical = classicalScore(test, description, hours_spent);
    let quantum_adjusted = quantumAdjustedScore(classical, description, approved_count, total_count);
    let eligibilityLbl = eligibilityLabel(quantum_adjusted);
    let tags = autoTag(title, description);
    let suggestion = adminSuggestion(test, quantum_adjusted);

    let label_text = switch (eligibilityLbl) {
      case (#eligible) { "ELIGIBLE" };
      case (#borderline) { "BORDERLINE" };
      case (#ineligible) { "INELIGIBLE" };
    };
    let reasoning = "IRC §41 classification: classical score " # debug_show(classical) #
      ", quantum-adjusted " # debug_show(quantum_adjusted) #
      ", label " # label_text # ". " # test.notes;

    {
      eligibility_score = classical;
      quantum_adjusted_score = quantum_adjusted;
      eligibility_label = eligibilityLbl;
      four_part_test = test;
      suggested_tags = tags;
      agent_reasoning = reasoning;
      admin_suggestion = suggestion;
    }
  };
};
