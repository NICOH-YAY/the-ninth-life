# AI-use disclosure: Codex-authored native tests for the preserved between-fight adaptive planner; no live network calls.
extends SceneTree
const PLANNER = preload("res://run_planner.gd")
var checks: int = 0

func _initialize() -> void:
    call_deferred("_run")

func check(value: bool, message: String) -> void:
    checks += 1
    if not value:
        push_error(message)
        quit(1)

func _run() -> void:
    var planner: Node = PLANNER.new()
    root.add_child(planner)
    var session_pattern := RegEx.new()
    session_pattern.compile("^[A-Za-z0-9_-]{4,64}$")
    check(session_pattern.search(planner.session_id) != null, "Session IDs must satisfy the existing Worker schema.")
    var all: Array[String] = ["alley", "sailor", "acrobat", "witch", "knight", "thief"]
    for move in ["cleave", "throw", "reap", "nova"]:
        var summary: Dictionary = {"move_counts": {move: 12}, "killing_move": move}
        var result: Dictionary = await planner.choose_next(summary, [], all, 2, 0)
        check(result.life == planner.COUNTER_LIFE[move], "Most-used move must select its still-available counter.")
        check(result.tactics.bait_attack == move, "Counter must bait the move it can defend.")
        check(result.tactics.dodge_priority[0] == move, "Countered move must lead defense priority.")
    var history: Array = [{"moveCounts": {"throw": 20}, "topBigrams": [["throw", "nova", 8]]}]
    var latest: Dictionary = {"moveCounts": {"cleave": 2}, "killingMove": "cleave"}
    var remembered: Dictionary = await planner.choose_next(latest, history, all, 4, 6)
    check(remembered.life == "sailor", "Run memory must influence the next selection.")
    check(remembered.tactics.dodge_priority[1] == "nova", "Observed follow-up must influence defense ordering.")
    var missing_counter: Array[String] = ["knight", "thief"]
    var flexible: Dictionary = await planner.choose_next({"move_counts": {"cleave": 30}}, [], missing_counter, 5, 0)
    check(flexible.life == "knight", "An exhausted counter must not be chosen again.")
    check(flexible.tactics.distance == "far", "Repeated close sword pressure must influence spacing.")
    var repeat: Dictionary = await planner.choose_next(latest, history, all, 4, 6)
    check(JSON.stringify(repeat) == JSON.stringify(remembered), "Offline plans must be deterministic.")
    var fixed_only: Array[String] = ["kitten", "quiet", "patchwork"]
    var exhausted: Dictionary = await planner.choose_next({}, [], fixed_only, 8, 0)
    check(exhausted.life.is_empty(), "The planner cannot override authored tutorial or final encounters.")
    var live: Dictionary = {"next_life": "witch", "tactics": {"aggression": 4.0, "distance": "far", "bait_attack": "nova", "dodge_priority": ["nova", "cleave"]}, "rationale": "Observed nova usage."}
    var accepted: Dictionary = planner.validate_reply(live, all)
    check(accepted.life == "witch" and accepted.source == "agent", "A valid remaining live life is accepted.")
    check(accepted.tactics.aggression == 1.0, "Live aggression is bounded by game rules.")
    var used: Array[String] = ["alley"]
    check(planner.validate_reply(live, used).is_empty(), "Used lives must be rejected.")
    live.tactics.dodge_priority = ["nova", "nova"]
    check(planner.validate_reply(live, all).is_empty(), "Duplicate defense priorities must be rejected.")
    live.tactics.dodge_priority = ["delete_castle"]
    check(planner.validate_reply(live, all).is_empty(), "Unknown move IDs must be rejected.")
    var unsafe: Dictionary = await planner.choose_next(latest, [], all, 2, 0, "http://not-allowed.invalid")
    check(unsafe.source == "fallback" and planner.calls == 0, "Insecure endpoints must fall back without network access.")
    planner.calls = planner.call_cap
    var capped: Dictionary = await planner.choose_next(latest, [], all, 2, 0, "https://no-request.invalid")
    check(capped.source == "fallback" and planner.calls == planner.call_cap, "The call cap must prevent all further requests.")
    var normalized: Dictionary = planner._worker_summary({"life": "alley", "move_counts": {"throw": 7}, "killing_move": "throw"}, 2)
    check(normalized.lifeId == "alley" and normalized.moveCounts.throw == 7, "Native summaries must serialize to the original Worker schema.")
    check(planner.timeout_seconds <= 5.0, "Between-fight calls remain bounded in time.")
    print(JSON.stringify({"ok": true, "checks": checks, "network_calls": 0, "planner": "native_adaptive"}))
    planner.queue_free()
    await process_frame
    quit(0)
