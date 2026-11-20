# AI-use disclosure: Codex ported the course's between-fight adaptive planner and optional validated Worker client to Godot.
class_name RunPlanner
extends Node

const MOVES: Array[String] = ["cleave", "throw", "reap", "nova"]
const CHOOSABLE: Array[String] = ["alley", "sailor", "acrobat", "witch", "knight", "thief"]
const COUNTER_LIFE: Dictionary = {"cleave": "alley", "throw": "sailor", "reap": "acrobat", "nova": "witch"}
const COUNTER_MOVE: Dictionary = {"alley": "cleave", "sailor": "throw", "acrobat": "reap", "witch": "nova"}
const ALLOWED_FACTS: Array[String] = [
    "The challenger is one soul returning through different feline lives.",
    "The Immortal is a sword-bearing cat king. The crown binds the castle, not the chair.",
    "Each returning life wears different accessories and carries its own weapon and defensive skill.",
    "At half health the king adopts a more powerful area-control stance without becoming a monster.",
    "The combat and ending rules are controlled by the game. The planner selects only the next remaining life and tactics."
]
var calls: int = 0
var call_cap: int = 6
var timeout_seconds: float = 5.0
var busy: bool = false
var session_id: String = "godot-" + str(int(Time.get_unix_time_from_system())) + "-" + str(Time.get_ticks_msec())
var last_result: Dictionary = {}

# Call only while combat is stopped, after recording the previous encounter.
func choose_next(summary: Dictionary, history: Array, remaining: Array[String], fight_index: int, bond: int, worker_url: String = "") -> Dictionary:
    var available: Array[String] = []
    for life in remaining:
        if CHOOSABLE.has(life) and not available.has(life):
            available.append(life)
    if available.is_empty():
        last_result = {"life": "", "tactics": _default_tactics(), "source": "none", "rationale": "No eligible mortal visitor remains."}
        return last_result
    var fallback: Dictionary = heuristic(summary, history, available, fight_index, bond)
    var endpoint: String = worker_url.strip_edges().trim_suffix("/")
    if endpoint.is_empty():
        last_result = fallback
        return last_result
    if not endpoint.begins_with("https://") or endpoint.contains("\n") or endpoint.contains("\r") or endpoint.contains(" "):
        last_result = _fallback(fallback, "Worker URL must use HTTPS.")
        return last_result
    if fight_index < 2 or fight_index > 7:
        last_result = _fallback(fallback, "This authored encounter is outside the live planning slots.")
        return last_result
    if calls >= call_cap:
        last_result = _fallback(fallback, "Session call cap reached.")
        return last_result
    if busy or not is_inside_tree():
        last_result = _fallback(fallback, "Planner is unavailable while another request is pending.")
        return last_result
    calls += 1
    busy = true
    var request := HTTPRequest.new()
    request.timeout = minf(5.0, maxf(0.1, timeout_seconds))
    request.body_size_limit = 32000
    add_child(request)
    var normal_history: Array = []
    for item in history.slice(-8):
        if item is Dictionary:
            normal_history.append(_worker_summary(item, maxi(1, fight_index - 1)))
    var payload: Dictionary = {
        "sessionId": session_id,
        "fightIndex": fight_index,
        "tier": 1 if fight_index <= 3 else 2 if fight_index <= 6 else 3,
        "bond": clampi(bond, 0, 8),
        "remaining": available,
        "memory": "history",
        "summary": _worker_summary(summary, maxi(1, fight_index - 1)) if not summary.is_empty() else null,
        "history": normal_history,
        "allowedFacts": ALLOWED_FACTS
    }
    if not endpoint.ends_with("/plan"):
        endpoint += "/plan"
    var start_error: Error = request.request(endpoint, PackedStringArray(["Content-Type: application/json"]), HTTPClient.METHOD_POST, JSON.stringify(payload))
    if start_error != OK:
        busy = false
        request.queue_free()
        last_result = _fallback(fallback, "Request could not start.")
        return last_result
    var response: Array = await request.request_completed
    busy = false
    request.queue_free()
    if int(response[0]) != HTTPRequest.RESULT_SUCCESS or int(response[1]) < 200 or int(response[1]) >= 300:
        last_result = _fallback(fallback, "Worker request failed or timed out.")
        return last_result
    var bytes: PackedByteArray = response[3]
    var parsed: Variant = JSON.parse_string(bytes.get_string_from_utf8())
    if not parsed is Dictionary:
        last_result = _fallback(fallback, "Worker returned invalid JSON.")
        return last_result
    var raw: Variant = parsed.get("plan", parsed)
    var accepted: Dictionary = validate_reply(raw, available)
    if accepted.is_empty():
        last_result = _fallback(fallback, "Worker plan failed remaining-life or tactics validation.")
        return last_result
    last_result = accepted
    return last_result

func heuristic(summary: Dictionary, history: Array, remaining: Array[String], fight_index: int, _bond: int = 0) -> Dictionary:
    var all: Array = []
    for item in history:
        if item is Dictionary and item != summary:
            all.append(item)
    if not summary.is_empty():
        all.append(summary)
    var weights: Dictionary = {"cleave": 0.0, "throw": 0.0, "reap": 0.0, "nova": 0.0}
    for item in all:
        var counts: Dictionary = _counts(item)
        for move in MOVES:
            weights[move] += maxf(0.0, float(counts.get(move, 0.0)))
    var killing: String = str(summary.get("killingMove", summary.get("killing_move", "")))
    if MOVES.has(killing):
        weights[killing] += 3.0
    var order: Array[String] = MOVES.duplicate()
    order.sort_custom(func(a: String, b: String) -> bool:
        return float(weights[a]) > float(weights[b]) if weights[a] != weights[b] else MOVES.find(a) < MOVES.find(b)
    )
    var top: String = order[0]
    var has_data: bool = float(weights[top]) > 0.0
    var life: String = ""
    if has_data:
        for move in order:
            if float(weights[move]) <= 0.0:
                break
            var counter: String = str(COUNTER_LIFE[move])
            if remaining.has(counter):
                life = counter
                break
    if life.is_empty():
        for flexible in ["knight", "thief"]:
            if remaining.has(flexible):
                life = flexible
                break
    if life.is_empty():
        for candidate in CHOOSABLE:
            if remaining.has(candidate):
                life = candidate
                break
    if life.is_empty():
        return {"life": "", "tactics": _default_tactics(), "source": "none", "rationale": "No eligible visitor."}
    var follow: Dictionary = {}
    var best_bigram: Array = []
    for item in all:
        var bigrams: Variant = item.get("topBigrams", item.get("top_bigrams", []))
        if not bigrams is Array:
            continue
        for pair in bigrams:
            if not pair is Array or pair.size() < 3 or not MOVES.has(str(pair[0])) or not MOVES.has(str(pair[1])):
                continue
            var a: String = str(pair[0])
            var b: String = str(pair[1])
            if not follow.has(a):
                follow[a] = {}
            follow[a][b] = float(follow[a].get(b, 0.0)) + maxf(0.0, float(pair[2]))
            if best_bigram.is_empty() or float(pair[2]) > float(best_bigram[2]):
                best_bigram = pair
    var bait: String = str(COUNTER_MOVE.get(life, str(best_bigram[0]) if not best_bigram.is_empty() else top))
    var after: Array[String] = MOVES.duplicate()
    var followers: Dictionary = follow.get(bait, {})
    after.sort_custom(func(a: String, b: String) -> bool:
        return float(followers.get(a, 0.0)) > float(followers.get(b, 0.0)) if followers.get(a, 0.0) != followers.get(b, 0.0) else MOVES.find(a) < MOVES.find(b)
    )
    var priority: Array[String] = [bait]
    for move in after:
        if float(followers.get(move, 0.0)) > 0.0 and not priority.has(move):
            priority.append(move)
    for move in order:
        if not priority.has(move):
            priority.append(move)
    var distance: String = "close" if life == "alley" else "far" if top == "cleave" and has_data else "mid"
    var aggression: float = minf(0.9, snappedf(0.35 + 0.06 * fight_index, 0.01))
    return {
        "life": life,
        "tactics": {"aggression": aggression, "distance": distance, "bait_attack": bait, "dodge_priority": priority.slice(0, 4)},
        "source": "heuristic",
        "rationale": "Most-used move " + top + " (weight " + str(weights[top]) + "); selected its remaining counter." if has_data else "No combat observations yet; selected a flexible remaining opponent."
    }

func validate_reply(raw: Variant, remaining: Array[String]) -> Dictionary:
    if not raw is Dictionary:
        return {}
    var life: String = str(raw.get("next_life", ""))
    if not CHOOSABLE.has(life) or not remaining.has(life):
        return {}
    var tactics: Variant = raw.get("tactics")
    if not tactics is Dictionary:
        return {}
    var aggression: Variant = tactics.get("aggression")
    if typeof(aggression) != TYPE_FLOAT and typeof(aggression) != TYPE_INT:
        return {}
    if is_nan(float(aggression)) or is_inf(float(aggression)):
        return {}
    var distance: String = str(tactics.get("distance", ""))
    var bait: String = str(tactics.get("bait_attack", ""))
    var priority: Variant = tactics.get("dodge_priority")
    if not ["close", "mid", "far"].has(distance) or not MOVES.has(bait) or not priority is Array or priority.is_empty() or priority.size() > 4:
        return {}
    var checked: Array[String] = []
    for move in priority:
        if not move is String or not MOVES.has(move) or checked.has(move):
            return {}
        checked.append(move)
    return {
        "life": life,
        "tactics": {"aggression": clampf(float(aggression), 0.0, 1.0), "distance": distance, "bait_attack": bait, "dodge_priority": checked},
        "source": "agent",
        "rationale": str(raw.get("rationale", "Validated between-fight agent plan.")).left(400)
    }

func _counts(summary: Dictionary) -> Dictionary:
    var value: Variant = summary.get("moveCounts", summary.get("move_counts", {}))
    return value if value is Dictionary else {}

func _default_tactics() -> Dictionary:
    return {"aggression": 0.5, "distance": "mid", "bait_attack": "cleave", "dodge_priority": MOVES.duplicate()}

func _fallback(plan: Dictionary, reason: String) -> Dictionary:
    var result: Dictionary = plan.duplicate(true)
    result.source = "fallback"
    result.rationale = reason + " " + str(result.get("rationale", ""))
    return result

func _worker_summary(raw: Dictionary, default_fight: int) -> Dictionary:
    var counts: Dictionary = {}
    var input: Dictionary = _counts(raw)
    for move in MOVES:
        counts[move] = clampi(int(input.get(move, 0)), 0, 10000)
    var life: String = str(raw.get("lifeId", raw.get("life_id", raw.get("life", "kitten"))))
    if not (CHOOSABLE + ["kitten", "quiet", "patchwork"]).has(life):
        life = "kitten"
    var killing: String = str(raw.get("killingMove", raw.get("killing_move", "")))
    var outcome: String = str(raw.get("outcome", "challenger_dead"))
    if not ["boss_dead", "challenger_dead", "spared"].has(outcome):
        outcome = "challenger_dead"
    return {
        "fight": clampi(int(raw.get("fight", raw.get("fightIndex", raw.get("fight_index", default_fight)))), 1, 9),
        "fightIndex": clampi(int(raw.get("fightIndex", raw.get("fight_index", default_fight))), 1, 9),
        "lifeId": life,
        "timeAliveMs": clampi(int(raw.get("timeAliveMs", raw.get("time_alive_ms", float(raw.get("duration", 0.0)) * 1000.0))), 0, 3600000),
        "damageDealt": clampi(int(raw.get("damageDealt", raw.get("damage_dealt", 0))), 0, 100000),
        "moveCounts": counts,
        "moveCountsByPhase": {"1": counts.duplicate(), "2": {"cleave": 0, "throw": 0, "reap": 0, "nova": 0}},
        "firstMoves": raw.get("firstMoves", raw.get("first_moves", [])),
        "topBigrams": raw.get("topBigrams", raw.get("top_bigrams", [])),
        "killingMove": killing if MOVES.has(killing) else null,
        "avgDistance": clampi(int(raw.get("avgDistance", raw.get("avg_distance", 0))), 0, 2000),
        "shiftsPerMin": 0,
        "novaAtBossHpPct": [],
        "phase2ReachedAtSec": raw.get("phase2ReachedAtSec", null),
        "diedInPhase": 2 if int(raw.get("phase", raw.get("diedInPhase", 1))) == 2 else 1,
        "bossMinHpPct": clampf(float(raw.get("bossMinHpPct", raw.get("boss_min_hp_pct", 1.0))), 0.0, 1.0),
        "directorAdjust": 0.0,
        "outcome": outcome,
        "hesitations": 0,
        "remaining": []
    }
