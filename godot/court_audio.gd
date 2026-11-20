# AI-use disclosure: Codex ported licensed music and cleaner recorded Foley to Godot AudioStreamPlayers.
class_name CourtAudio
extends Node

var muted: bool = false
var current_cue: String = ""
var requested_cue: String = ""
var dialogue_active: bool = false
var _music: Array[AudioStreamPlayer] = []
var _voices: Array[AudioStreamPlayer] = []
var _streams: Dictionary = {}
var _positions: Dictionary = {}
var _index: int = -1
var _voice_index: int = 0
var _fade: float = 1.0
var _old_index: int = -1
var _old_gain: float = 0.0
var _duck_level: float = 1.0
var _step: int = 0
var _cooldowns: Dictionary = {}
const FADE_SECONDS: float = 1.25
const TRACK_GAIN: Dictionary = {"menu": 0.30, "years": 0.27, "kitten": 0.33, "alley": 0.35, "sailor": 0.34, "acrobat": 0.34, "witch": 0.34, "knight": 0.35, "thief": 0.32, "quiet": 0.31, "patchwork": 0.36, "finale": 0.32}
const SFX_GAIN: Dictionary = {"sword-swing": 0.78, "sword-hit": 0.74, "sword-draw": 0.57, "guard": 0.63, "chain": 0.62, "wood": 0.58, "ice": 0.47, "flesh": 0.63, "stab": 0.75, "dash": 0.54, "magic": 0.50, "step1": 0.22, "step2": 0.22, "nova": 0.66, "cloth": 0.28}
const ALIASES: Dictionary = {"sword": "sword-swing", "swing": "sword-swing", "slash": "sword-swing", "thrust": "sword-swing", "hit": "flesh", "sword_hit": "sword-hit", "metal": "sword-hit", "metal-hit": "sword-hit", "block": "guard", "metal-guard": "guard", "evade": "dash", "jump": "cloth", "cast": "magic", "phase2": "magic", "boom": "nova", "explosion": "nova", "death": "stab"}

func _ready() -> void:
    process_mode = Node.PROCESS_MODE_ALWAYS
    for i in range(2):
        var player := AudioStreamPlayer.new()
        player.name = "Score" + str(i)
        player.playback_type = AudioServer.PLAYBACK_TYPE_STREAM
        player.volume_db = -80.0
        add_child(player)
        _music.append(player)
    for i in range(12):
        var player := AudioStreamPlayer.new()
        player.name = "Foley" + str(i)
        player.playback_type = AudioServer.PLAYBACK_TYPE_SAMPLE if OS.has_feature("web") else AudioServer.PLAYBACK_TYPE_STREAM
        add_child(player)
        _voices.append(player)
    for kind in SFX_GAIN:
        var path: String = "res://audio/sfx/" + str(kind) + ".ogg"
        if ResourceLoader.exists(path):
            _streams[kind] = load(path)

func music(cue: String) -> void:
    if cue == "combat":
        cue = "kitten"
    if not TRACK_GAIN.has(cue):
        cue = "years"
    requested_cue = cue
    if cue == current_cue and _index >= 0 and _music[_index].playing:
        return
    _start_cue(cue, false)

func _start_cue(cue: String, repeating: bool) -> void:
    var path: String = "res://audio/music/" + cue + ".mp3"
    if not ResourceLoader.exists(path):
        push_warning("Missing score cue: " + path)
        return
    if _index >= 0 and current_cue != cue:
        _positions[current_cue] = _music[_index].get_playback_position()
    _old_index = _index
    _old_gain = db_to_linear(_music[_old_index].volume_db) / maxf(_duck_level, 0.01) if _old_index >= 0 else 0.0
    _index = 0 if _index < 0 else 1 - _index
    var next: AudioStreamPlayer = _music[_index]
    next.stop()
    var stream: AudioStreamMP3 = load(path)
    next.stream = stream
    var position: float = 0.0 if repeating else float(_positions.get(cue, 0.0))
    if position >= stream.get_length() - 2.0:
        position = 0.0
    next.volume_db = -80.0
    next.play(position)
    current_cue = cue
    _fade = 0.0
    _positions[cue] = position

func _process(delta: float) -> void:
    for key in _cooldowns.keys():
        _cooldowns[key] = maxf(0.0, float(_cooldowns[key]) - delta)
    var target: float = 0.25 if dialogue_active else 1.0
    var time_constant: float = 0.12 if dialogue_active else 0.65
    _duck_level = lerpf(_duck_level, target, 1.0 - exp(-delta / time_constant))
    if _index < 0:
        return
    _fade = minf(1.0, _fade + delta / FADE_SECONDS)
    var gain: float = float(TRACK_GAIN.get(current_cue, 0.3))
    _music[_index].volume_db = linear_to_db(maxf(0.0001, gain * sin(_fade * PI * 0.5) * _duck_level))
    if _old_index >= 0 and _old_index != _index:
        if _fade >= 1.0:
            _music[_old_index].stop()
            _old_index = -1
        else:
            _music[_old_index].volume_db = linear_to_db(maxf(0.0001, _old_gain * cos(_fade * PI * 0.5) * _duck_level))
    var player: AudioStreamPlayer = _music[_index]
    if _fade >= 1.0 and current_cue != "finale" and player.stream:
        var remaining: float = player.stream.get_length() - player.get_playback_position()
        if remaining < FADE_SECONDS + 0.12 or not player.playing:
            _start_cue(current_cue, true)

func dialogue_duck(active: bool) -> void:
    dialogue_active = active

func toggle_mute() -> bool:
    muted = not muted
    AudioServer.set_bus_mute(AudioServer.get_bus_index("Master"), muted)
    return muted

func sfx(kind: String) -> void:
    if kind == "step" or kind == "footstep":
        _step = 1 - _step
        kind = "step1" if _step == 0 else "step2"
    kind = str(ALIASES.get(kind, kind))
    if not _streams.has(kind) or _voices.is_empty():
        return
    var cooldown: float = 0.055 if kind != "guard" else 0.10
    if float(_cooldowns.get(kind, 0.0)) > 0.0:
        return
    _cooldowns[kind] = cooldown
    var player: AudioStreamPlayer = _voices[_voice_index]
    _voice_index = (_voice_index + 1) % _voices.size()
    player.stop()
    player.stream = _streams[kind]
    player.pitch_scale = 1.0
    player.volume_db = linear_to_db(float(SFX_GAIN.get(kind, 0.6)))
    player.play()

func debug_state() -> Dictionary:
    var players: Array = []
    for player in _music:
        players.append({"playing": player.playing, "position": player.get_playback_position(), "db": player.volume_db})
    return {"cue": current_cue, "requested": requested_cue, "ducked": dialogue_active, "duck": _duck_level, "muted": muted, "music_players": players, "foley_loaded": _streams.size()}

func stop_all() -> void:
    _index = -1
    _old_index = -1
    current_cue = ""
    for player in _music:
        player.stop()
        player.stream = null
    for player in _voices:
        player.stop()
        player.stream = null

func _exit_tree() -> void:
    stop_all()
    _streams.clear()