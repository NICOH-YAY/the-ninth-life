# AI-use disclosure: Codex-authored native Godot checks for court dialogue, input persistence and bounded audio playback.
extends SceneTree

const UI_SCRIPT = preload("res://court_ui.gd")
const AUDIO_SCRIPT = preload("res://court_audio.gd")
var assertions: int = 0
var ui: CanvasLayer

func _initialize() -> void:
    call_deferred("_run")

func check(value: bool, message: String) -> void:
    assertions += 1
    if not value:
        push_error(message)
        quit(1)

func _press(code: int) -> void:
    var event := InputEventKey.new()
    event.physical_keycode = code
    event.pressed = true
    ui._input(event)

func _answer_choice() -> void:
    await process_frame
    check(ui.choosing, "Choices must remain interactive until an explicit answer.")
    check(ui.caption.is_empty() and not ui._choice_caption.visible and ui._choice_caption.text.is_empty(), "Story choices must not expose counters, eyebrows or control captions.")
    check(ui._choice_buttons[0].text == "Remember the crown." and ui._choice_buttons[1].text == "Deny the memory.", "Choice text must contain only authored dialogue.")
    _press(KEY_DOWN)
    check(ui.selected_choice == 1, "Down selects the second answer.")
    _press(KEY_UP)
    check(ui.selected_choice == 0, "Up returns to the first answer.")
    _press(KEY_ENTER)

func _run() -> void:
    if OS.get_name() == "Windows":
        check(OS.get_user_data_dir().begins_with("D:/") or OS.get_user_data_dir().begins_with("D:\\"), "Native test profile must remain on D:.")
    else:
        check(OS.get_user_data_dir().begins_with(OS.get_environment("XDG_DATA_HOME")), "CI test profile must remain under the isolated Godot tool data directory.")
    var data: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://content/visitors.json"))
    var visitors: Dictionary = data.get("visitors", {})
    check(visitors.size() == 9, "All nine branching conversations must be ported.")
    for life in visitors:
        var script: Dictionary = visitors[life]
        check(script.has("power") and script.has("ultimate") and script.has("sacrifice") and script.has("entrance"), "Every life needs its own innate power, ultimate, personal cost and entrance.")
        check(not script.has("vow_choice") and not "15%" in JSON.stringify(script) and not "half my guard" in JSON.stringify(script).to_lower(), "Story exchanges must not negotiate combat statistics.")
        check(script.first.choices.size() == 2 and script.first.responses.size() == 2, "First exchange must contain two actual branches.")
        check(script.second.size() == 2, "Second exchange must depend on the first answer.")
        for branch in script.second:
            check(branch.choices.size() == 2 and branch.responses.size() == 2, "Both second-exchange branches must remain complete.")
    var audio: Node = AUDIO_SCRIPT.new()
    root.add_child(audio)
    ui = UI_SCRIPT.new()
    ui.audio = audio
    root.add_child(ui)
    check(audio._streams.size() == 17, "All seventeen recorded Foley clips must load, including perfect-block and poise-break accents.")
    check(audio._accent.stream != null and audio._accent.stream.get_length() > 2.0, "The original orchestral accent must load as a real audio asset.")
    for cue in audio.TRACK_GAIN:
        var stream: AudioStream = load("res://audio/music/" + str(cue) + ".mp3")
        check(stream != null and stream.get_length() > 80.0, "Every score cue must be a real recording.")
    audio.music("menu")
    await create_timer(0.12).timeout
    var first_index: int = audio._index
    audio.music("menu")
    check(audio._index == first_index, "Repeated requests must not restart the current score.")
    audio.music("years")
    audio.music("kitten")
    check(audio._music.size() == 2, "Rapid scene changes must never allocate additional music players.")
    await create_timer(1.5).timeout
    var playing: int = 0
    for player in audio._music:
        if player.playing:
            playing += 1
    check(playing == 1, "Crossfade must stop the previous score.")
    audio.set_tension(0.0)
    await create_timer(0.9).timeout
    var quiet_mix: float = audio._duck_level
    check(quiet_mix < 0.75, "Quiet scenes leave room before the orchestral swell.")
    audio.set_tension(2.0)
    check(audio._tension == 1.0, "Tension must clamp to a valid mix range.")
    await create_timer(1.2).timeout
    check(audio._duck_level > quiet_mix + 0.15, "High tension must swell the orchestra above quiet waiting.")
    audio.pulse("perfect-block")
    check(audio._accent.playing and audio._last_pulse == "perfect-block", "Perfect block must trigger the bounded original accent.")
    audio.pulse("climax")
    check(audio._last_pulse == "perfect-block", "Rapid impact accents must respect their cooldown.")
    check(audio._music.size() == 2, "Tension and accents must not allocate full-song layers.")
    audio.set_tension(0.0)
    audio.dialogue_duck(true)
    await create_timer(0.45).timeout
    check(audio._duck_level < 0.30, "Dialogue must reduce score level.")
    check(audio.toggle_mute(), "Mute should turn on.")
    check(AudioServer.is_bus_mute(0), "Mute must include every sound bus.")
    check(not audio.toggle_mute(), "Unmute should turn sound back on.")
    var previous_voice: int = audio._voice_index
    audio.sfx("sword")
    audio.sfx("guard")
    audio.sfx("stab")
    check(audio._voice_index == (previous_voice + 3) % audio._voices.size(), "Sword, guard and stab must use recorded playback voices.")
    ui.set_hud({"phase": 2})
    check(ui._player_label.text == "THE HOLLOW SOVEREIGN", "The transformed form must use its new name.")
    check(ui._move_labels[0].text == "Gloam Rake" and ui._move_labels[1].text == "Crownfall" and ui._move_labels[2].text == "Royal Undertow" and ui._move_labels[3].text == "Last Dominion", "The transformed HUD must restore the previous sword-and-area attack names.")
    check(ui.layer >= 100 and ui._speech.clip_contents and ui._choice.clip_contents, "Dialogue must render above gameplay and clip contained artwork.")
    check(ui._speech.get_theme_stylebox("panel").bg_color.a == 1.0 and ui._choice.get_theme_stylebox("panel").bg_color.a == 1.0, "Story panels must fully occlude swords and effects.")
    ui.show_menu()
    var menu_items: Array[String] = []
    for child in ui._menu.get_children():
        if child is Button:
            menu_items.append(child.text)
            check(child.get_theme_stylebox("normal").bg_color.a == 0.0, "Main menu items must remain unboxed.")
    check(menu_items == ["PLAY", "CONTROLS", "CREDITS"], "The main menu must expose three minimal items.")
    ui.set_hud({"guard": 1.0, "enemy_ultimate": "This Gate Will Hold"})
    check(ui._guard_fill.size.x == 180.0, "Guard capacity must remain independent of dialogue choices.")
    ui.set_hud({"phase":1,"enemy_ultimate":"This Gate Will Hold"})
    check(ui._move_labels[0].text=="Crownsteel" and ui._move_labels[1].text=="Oathpiercer","The original sword kit must return on the native HUD.")
    check(not "Pressure" in ui._move_panels[1].tooltip_text,"Classic actions must not advertise the rejected resource gate.")
    ui.set_hud({"phase":2,"enemy_ultimate":"This Gate Will Hold"})
    check(ui._move_labels[1].text=="Crownfall" and ui._move_labels[3].text=="Last Dominion","The previous transformed kit must return with its original names.")
    check(ui._ultimate_label.text == "THIS GATE WILL HOLD", "Ultimate anticipation must expose the authored move label.")
    ui.set_hud({"guard": 0.0, "guard_break": false})
    check(ui._guard_state.text == "GUARD EXPOSED", "Zero stamina alone must not claim the guard is already broken.")
    ui.set_hud({"guard": 0.0, "guard_break": 0.4})
    check(ui._guard_state.text == "GUARD BROKEN", "The next-hit guard-break state must have an explicit indicator.")
    check("Morrow" in visitors.patchwork.first.responses[0] and "Morrow" in visitors.patchwork.first.responses[1], "The final encounter must reveal Morrow on either story branch.")
    ui.show_controls()
    ui._capturing = "jump"
    _press(KEY_W)
    check(ui.get_bindings().jump == KEY_W, "Settings must remap an actual InputMap action.")
    var second_ui: CanvasLayer = UI_SCRIPT.new()
    root.add_child(second_ui)
    check(second_ui.get_bindings().jump == KEY_W, "Keybinds must persist across UI instances.")
    second_ui.queue_free()
    ui._bindings = ui.DEFAULT_KEYS.duplicate()
    ui._save_bindings()
    ui._apply_bindings()
    call_deferred("_answer_choice")
    var answer: bool = await ui.choose(["Remember the crown.", "Deny the memory."], "YOUR ANSWER 1 / 2")
    check(answer, "Explicit first answer should resolve as open.")
    check(not ui.choosing, "Choice state must clear after answering.")
    ui.reset()
    check(not ui.reading and not ui.choosing, "Reset must clear story input states.")
    print(JSON.stringify({"ok": true, "checks": assertions, "music": audio.TRACK_GAIN.size(), "foley": audio._streams.size(), "conversations": visitors.size(), "user_data": OS.get_user_data_dir()}))
    audio.stop_all()
    await create_timer(0.2).timeout
    ui.queue_free()
    audio.queue_free()
    await process_frame
    await process_frame
    quit(0)
