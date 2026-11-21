# AI-use disclosure: Codex ported the court UI, keybinding settings and timed dialogue to native Godot controls.
class_name CourtUI
extends CanvasLayer
const ACTOR_SCRIPT = preload("res://actor_view.gd")

signal play_requested
signal menu_requested
signal reply_selected(open: bool)
signal mute_requested

var audio: Node
var choosing: bool = false
var reading: bool = false
var choice_options: Array = []
var selected_choice: int = 0
var caption: String = ""
var dialogue_text: String = ""
var _generation: int = 0
var _capturing: String = ""
var _bindings: Dictionary = {}
var _backdrop_path: String = ""
var _menu_page: String = ""
var _last_portrait: String = ""
var _root: Control
var _menu: Control
var _speech: Panel
var _portrait: TextureRect
var _speaker: Label
var _body: Label
var _choice: Panel
var _choice_caption: Label
var _choice_buttons: Array[Button] = []
var _hud: Control
var _enemy_label: Label
var _player_label: Label
var _year_label: Label
var _hint: Label
var _enemy_fill: ColorRect
var _player_fill: ColorRect
var _guard_fill: ColorRect
var _guard_state: Label
var _ultimate_label: Label
var _move_icons:Array[TextureRect]=[]
var _pressure_fill: ColorRect
var _pressure_label: Label
var _exposure_label: Label
var _move_panels: Array[Panel] = []
var _move_labels: Array[Label] = []
var _move_keys: Array[Label] = []
var _notice: Panel
var _notice_label: Label
const ACTIONS: Array[String] = ["left", "right", "jump", "dash", "cleave", "throw", "reap", "nova", "guard", "hold"]
const DEFAULT_KEYS: Dictionary = {"left": KEY_A, "right": KEY_D, "jump": KEY_SPACE, "dash": KEY_SHIFT, "cleave": KEY_J, "throw": KEY_K, "reap": KEY_L, "nova": KEY_F, "guard": KEY_G, "hold": KEY_S}
const ACTION_LABELS: Dictionary = {"left": "Move left", "right": "Move right", "jump": "Jump", "dash": "Dash", "cleave": "Crownless Hand / Hollow Orbit", "throw": "Borrowed Hour / Vacant Step", "reap": "Royal Burden / Unmoored", "nova": "King’s Ransom / Empty Throne", "guard": "Guard", "hold": "Lower guard"}

func _ready() -> void:
    layer = 100
    _root = Control.new()
    _root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    _root.mouse_filter = Control.MOUSE_FILTER_IGNORE
    _root.theme = Theme.new()
    var pixel_font: Font = ThemeDB.fallback_font.duplicate()
    if pixel_font is FontFile:
        pixel_font.antialiasing = TextServer.FONT_ANTIALIASING_NONE
        pixel_font.subpixel_positioning = TextServer.SUBPIXEL_POSITIONING_DISABLED
    _root.theme.default_font = pixel_font
    add_child(_root)
    _load_bindings()
    _make_hud()
    _make_dialogue()
    _make_notice()
    _menu = Control.new()
    _menu.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    _menu.mouse_filter = Control.MOUSE_FILTER_IGNORE
    _root.add_child(_menu)

func _label(parent: Node, text: String, at: Vector2, dimensions: Vector2, font_size: int = 16, color: Color = Color("#d6dfdc")) -> Label:
    var label := Label.new()
    label.text = text
    label.position = at
    label.size = dimensions
    label.add_theme_font_size_override("font_size", font_size)
    label.add_theme_color_override("font_color", color)
    label.mouse_filter = Control.MOUSE_FILTER_IGNORE
    parent.add_child(label)
    return label

func _box(parent: Node, at: Vector2, dimensions: Vector2, fill: Color, border: Color = Color("#6b767d")) -> Panel:
    var panel := Panel.new()
    panel.position = at
    panel.size = dimensions
    panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
    var style := StyleBoxFlat.new()
    style.bg_color = fill
    style.border_color = border
    style.set_border_width_all(2)
    panel.add_theme_stylebox_override("panel", style)
    parent.add_child(panel)
    return panel

func _button(parent: Node, text: String, at: Vector2, dimensions: Vector2, callback: Callable, font_size: int = 17) -> Button:
    var button := Button.new()
    button.text = text
    button.position = at
    button.size = dimensions
    button.add_theme_font_size_override("font_size", font_size)
    button.add_theme_color_override("font_color", Color("#e8d7a7"))
    button.add_theme_color_override("font_hover_color", Color("#fff0c0"))
    for state in ["normal", "hover", "pressed", "focus"]:
        var style := StyleBoxFlat.new()
        style.bg_color = Color("#0d1928") if state == "normal" else Color("#223247")
        style.border_color = Color("#536477") if state == "normal" else Color("#dbc58f")
        style.set_border_width_all(1 if state == "normal" else 2)
        style.content_margin_left = 14
        style.content_margin_right = 14
        button.add_theme_stylebox_override(state, style)
    button.pressed.connect(callback)
    parent.add_child(button)
    return button

func _make_hud() -> void:
    _hud = Control.new()
    _hud.mouse_filter = Control.MOUSE_FILTER_IGNORE
    _root.add_child(_hud)
    _enemy_label = _label(_hud, "?? // ??", Vector2(28, 7), Vector2(260, 25), 14, Color("#ead9a7"))
    _player_label = _label(_hud, "THE IMMORTAL", Vector2(650, 7), Vector2(282, 25), 14, Color("#f0d8a1"))
    _player_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
    _year_label = _label(_hud, "YEAR 1000", Vector2(360, 15), Vector2(240, 24), 13, Color("#b6c9ca"))
    _year_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    var enemy_back := ColorRect.new()
    enemy_back.position = Vector2(28, 36)
    enemy_back.size = Vector2(244, 10)
    enemy_back.color = Color("#101826")
    _hud.add_child(enemy_back)
    _enemy_fill = ColorRect.new()
    _enemy_fill.position = Vector2(29, 37)
    _enemy_fill.size = Vector2(242, 8)
    _enemy_fill.color = Color("#79c8a8")
    _hud.add_child(_enemy_fill)
    var player_back := ColorRect.new()
    player_back.position = Vector2(630, 36)
    player_back.size = Vector2(302, 10)
    player_back.color = Color("#101826")
    _hud.add_child(player_back)
    _player_fill = ColorRect.new()
    _player_fill.position = Vector2(631, 37)
    _player_fill.size = Vector2(300, 8)
    _player_fill.color = Color("#e5bc6d")
    _hud.add_child(_player_fill)
    _guard_fill = ColorRect.new()
    _guard_fill.position = Vector2(632, 52)
    _guard_fill.size = Vector2(180, 3)
    _guard_fill.color = Color("#91c8e9")
    _hud.add_child(_guard_fill)
    _guard_state = _label(_hud, "", Vector2(632, 58), Vector2(185, 20), 10, Color("#ffc397"))
    _ultimate_label = _label(_hud, "", Vector2(28, 51), Vector2(310, 30), 11, Color("#ebc586"))
    _ultimate_label.clip_text = true
    _pressure_fill = ColorRect.new()
    _pressure_fill.position = Vector2(784,58)
    _pressure_fill.size = Vector2(148,3)
    _pressure_fill.color = Color("#c1b4f2")
    _pressure_fill.mouse_filter = Control.MOUSE_FILTER_IGNORE
    _hud.add_child(_pressure_fill)
    _pressure_label = _label(_hud, "PRESSURE 60", Vector2(784,63), Vector2(148,17), 10, Color("#c1b4f2"))
    _pressure_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
    _exposure_label = _label(_hud, "", Vector2(682,82), Vector2(250,18), 10, Color("#ffb18d"))
    _exposure_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
    _hint = _label(_hud, "", Vector2(80, 63), Vector2(800, 25), 13, Color("#edda9f"))
    _hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    for i in range(4):
        var panel := _box(_hud, Vector2(230 + i * 126, 495), Vector2(120, 38), Color("#091321"), Color("#627a86"))
        panel.mouse_filter = Control.MOUSE_FILTER_STOP
        _move_panels.append(panel)
        var icon := TextureRect.new()
        icon.texture = ACTOR_SCRIPT.skill_icon(i)
        icon.position = Vector2(3, 3)
        icon.size = Vector2(32, 32)
        icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
        icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
        icon.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
        icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
        panel.add_child(icon)
        _move_icons.append(icon)
        var key_label := _label(panel, "", Vector2(39, 1), Vector2(76, 16), 10, Color("#a9bbc8"))
        var label := _label(panel, "", Vector2(39, 18), Vector2(76, 17), 10)
        label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
        label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
        key_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
        label.clip_text = true
        key_label.clip_text = true
        _move_labels.append(label)
        _move_keys.append(key_label)
    hide_hud()

func _make_dialogue() -> void:
    _speech = _box(_root, Vector2(40, 84), Vector2(880, 126), Color("#060c16"), Color("#b9a37d"))
    _speech.clip_contents = true
    _speech.z_index = 20
    _portrait = TextureRect.new()
    _portrait.position = Vector2(9, 11)
    _portrait.size = Vector2(102, 102)
    _portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
    _portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
    _portrait.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
    _portrait.mouse_filter = Control.MOUSE_FILTER_IGNORE
    _speech.add_child(_portrait)
    _speaker = _label(_speech, "", Vector2(127, 10), Vector2(735, 23), 14, Color("#efd48e"))
    _body = _label(_speech, "", Vector2(127, 38), Vector2(728, 83), 18)
    _body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
    _choice = _box(_root, Vector2(68, 222), Vector2(824, 128), Color("#060c16"), Color("#9a9279"))
    _choice.clip_contents = true
    _choice.z_index = 20
    _choice_caption = _label(_choice, "", Vector2(18, 9), Vector2(788, 23), 12, Color("#b4c8cb"))
    _choice_caption.hide()
    for i in range(2):
        var index: int = i
        var button := _button(_choice, "", Vector2(16, 16 + i * 51), Vector2(792, 45), func() -> void: _pick(index == 0), 15)
        button.alignment = HORIZONTAL_ALIGNMENT_LEFT
        _choice_buttons.append(button)
        button.mouse_entered.connect(func() -> void:
            if choosing:
                selected_choice = index
                _refresh_choices()
        )
    _speech.hide()
    _choice.hide()

func _make_notice() -> void:
    _notice = _box(_root, Vector2(105, 421), Vector2(750, 104), Color(0.02, 0.035, 0.065, 0.95), Color("#7c8b8f"))
    _notice_label = _label(_notice, "", Vector2(18, 12), Vector2(714, 80), 18, Color("#e4dbc1"))
    _notice_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
    _notice_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    _notice_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
    _notice.hide()

func reset() -> void:
    _generation += 1
    reading = false
    if choosing:
        _pick(false)
    choosing = false
    choice_options = []
    dialogue_text = ""
    hide_dialogue()
    hide_notice()
    _capturing = ""
    if audio:
        audio.dialogue_duck(false)

func hide_dialogue() -> void:
    _speech.hide()
    _choice.hide()

func speak(speaker: String, text: String, portrait_key: String = "", min_secs: float = 2.2) -> void:
    if not is_inside_tree():
        return
    _generation += 1
    var generation: int = _generation
    reading = true
    dialogue_text = text
    _last_portrait = portrait_key
    _speaker.text = speaker.to_upper()
    _body.text = text
    _body.visible_characters = 0
    _portrait.texture = ACTOR_SCRIPT.portrait_texture(portrait_key)
    _speech.show()
    _choice.hide()
    if audio:
        audio.dialogue_duck(true)
    var duration: float = maxf(min_secs, text.length() * 0.032 + 0.8)
    var elapsed: float = 0.0
    while generation == _generation and is_inside_tree() and elapsed < duration:
        await get_tree().process_frame
        elapsed += get_process_delta_time()
        _body.visible_characters = mini(text.length(), int(elapsed / 0.022))
    if generation != _generation:
        return
    _body.visible_characters = -1
    reading = false
    _speech.hide()
    if audio:
        audio.dialogue_duck(false)

func choose(options: Array, _caption_text: String = "") -> bool:
    if options.size() != 2:
        push_error("CourtUI expects exactly two authored replies.")
        return false
    choice_options = options.duplicate()
    caption = ""
    _choice_caption.text = ""
    _choice_caption.hide()
    selected_choice = 0
    choosing = true
    _choice.show()
    _speech.visible = not dialogue_text.is_empty()
    _body.visible_characters = -1
    if audio:
        audio.dialogue_duck(true)
    _refresh_choices()
    var answer: bool = await reply_selected
    _choice.hide()
    _speech.hide()
    if audio:
        audio.dialogue_duck(false)
    return answer

func _refresh_choices() -> void:
    for i in range(_choice_buttons.size()):
        _choice_buttons[i].text = str(choice_options[i]) if i < choice_options.size() else ""
        _choice_buttons[i].add_theme_color_override("font_color", Color("#ffdfa0") if selected_choice == i else Color("#b4c5cc"))
        var normal: StyleBoxFlat = _choice_buttons[i].get_theme_stylebox("normal").duplicate()
        normal.border_color = Color("#dbc58f") if selected_choice == i else Color("#536477")
        normal.bg_color = Color("#1a293b") if selected_choice == i else Color("#0d1928")
        _choice_buttons[i].add_theme_stylebox_override("normal", normal)

func _pick(open: bool) -> void:
    if not choosing:
        return
    choosing = false
    reply_selected.emit(open)

func show_notice(text: String) -> void:
    _notice_label.text = text
    _notice.show()

func hide_notice() -> void:
    _notice.hide()

func show_menu(backdrop_path: String = "") -> void:
    reset()
    hide_hud()
    _backdrop_path = "res://art/menu-memory-v8.png" if ResourceLoader.exists("res://art/menu-memory-v8.png") else (backdrop_path if not backdrop_path.is_empty() else _backdrop_path)
    _clear_menu()
    _menu_page = "main"
    if ResourceLoader.exists(_backdrop_path):
        var background := TextureRect.new()
        background.texture = load(_backdrop_path)
        background.size = Vector2(960, 540)
        background.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
        background.stretch_mode = TextureRect.STRETCH_SCALE
        background.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
        background.mouse_filter = Control.MOUSE_FILTER_IGNORE
        _menu.add_child(background)
    var shade := ColorRect.new()
    shade.color = Color(0.015, 0.025, 0.04, 0.30)
    shade.position = Vector2.ZERO
    shade.size = Vector2(360, 540)
    shade.mouse_filter = Control.MOUSE_FILTER_IGNORE
    _menu.add_child(shade)
    _label(_menu, "THE NINTH LIFE", Vector2(58, 264), Vector2(345, 44), 28, Color("#eee0b8"))
    _menu_button("PLAY", Vector2(58, 338), Vector2(285, 42), func() -> void:
        hide_menu()
        play_requested.emit()
    )
    _menu_button("CONTROLS", Vector2(58, 391), Vector2(285, 42), show_controls)
    _menu_button("CREDITS", Vector2(58, 444), Vector2(285, 42), show_credits)


func _menu_button(text: String, at: Vector2, dimensions: Vector2, callback: Callable) -> Button:
    var button := _button(_menu, text, at, dimensions, callback, 17)
    button.alignment = HORIZONTAL_ALIGNMENT_LEFT
    for state in ["normal", "hover", "pressed", "focus"]:
        var style := StyleBoxFlat.new()
        style.bg_color = Color(0, 0, 0, 0)
        style.border_color = Color("#d9c28d")
        style.border_width_left = 2 if state != "normal" else 0
        style.content_margin_left = 12
        button.add_theme_stylebox_override(state, style)
    return button

func hide_menu() -> void:
    _menu.hide()
    _menu_page = ""

func _clear_menu() -> void:
    for child in _menu.get_children():
        _menu.remove_child(child)
        child.queue_free()
    _menu.show()

func show_controls() -> void:
    _clear_menu()
    _menu_page = "controls"
    _box(_menu, Vector2(22, 24), Vector2(916, 492), Color("#091523"), Color("#6c7c86"))
    _label(_menu, "CONTROLS", Vector2(56, 44), Vector2(700, 44), 27, Color("#efddb3"))
    _label(_menu, "Select an action, then press its new key. Reusing a key swaps the actions.", Vector2(56, 91), Vector2(850, 28), 14, Color("#b5c6ca"))
    for i in range(ACTIONS.size()):
        var action: String = ACTIONS[i]
        var x: int = 56 if i < 5 else 500
        var y: int = 143 + (i % 5) * 55
        _label(_menu, str(ACTION_LABELS[action]), Vector2(x + 8, y + 10), Vector2(235, 30), 14)
        _button(_menu, binding_label(action), Vector2(x + 247, y), Vector2(135, 43), func() -> void:
            _capturing = action
            show_notice("Press the new key for " + str(ACTION_LABELS[action]) + ".\nEsc cancels. Enter is reserved.")
        , 14)
    _label(_menu, "Fresh guard opens a counter. Empty guard breaks on the next hit. Skills share finite Pressure.", Vector2(57, 420), Vector2(835, 18), 11, Color("#b5c6ca"))
    _button(_menu, "RESET DEFAULTS", Vector2(57, 459), Vector2(225, 39), func() -> void:
        _bindings = DEFAULT_KEYS.duplicate()
        _save_bindings()
        _apply_bindings()
        show_controls()
    , 14)
    _button(_menu, "BACK", Vector2(759, 459), Vector2(130, 39), func() -> void: show_menu(_backdrop_path), 14)

func show_credits() -> void:
    _clear_menu()
    _menu_page = "credits"
    _box(_menu, Vector2(25, 25), Vector2(910, 490), Color("#091523"), Color("#697b85"))
    _label(_menu, "ATTRIBUTIONS", Vector2(55, 44), Vector2(850, 42), 26, Color("#efdcb0"))
    var credits: String = FileAccess.get_file_as_string("res://content/credits.txt")
    var text := _label(_menu, credits, Vector2(55, 99), Vector2(850, 350), 13, Color("#c2d1d2"))
    text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
    _button(_menu, "BACK", Vector2(748, 462), Vector2(135, 38), func() -> void: show_menu(_backdrop_path), 14)

func set_hud(data: Dictionary) -> void:
    _hud.show()
    var enemy_hp: float = float(data.get("enemy_hp", 1.0))
    var enemy_max: float = maxf(1.0, float(data.get("enemy_max", 1.0)))
    var player_hp: float = float(data.get("player_hp", data.get("hp", 1.0)))
    var player_max: float = maxf(1.0, float(data.get("player_max", data.get("max_hp", 1.0))))
    _enemy_label.text = str(data.get("enemy_name", "?? // ??"))
    _player_label.text = "THE IMMORTAL" if int(data.get("phase", 1)) == 1 else "THE HOLLOW SOVEREIGN"
    _enemy_fill.size.x = 242.0 * clampf(enemy_hp / enemy_max, 0.0, 1.0)
    _enemy_fill.color = Color(str(data.get("enemy_color", "#73c8ab")))
    _player_fill.size.x = 300.0 * clampf(player_hp / player_max, 0.0, 1.0)
    _player_fill.color = Color("#e5bd71") if int(data.get("phase", 1)) == 1 else Color("#a9e6f0")
    var guard_max: float = clampf(float(data.get("guard_max", 1.0)), 0.01, 1.0)
    var guard: float = clampf(float(data.get("guard", guard_max)), 0.0, guard_max)
    var broken_value: Variant = data.get("guard_break", false)
    var broken: bool = bool(broken_value) if broken_value is bool else float(broken_value) > 0.0
    _guard_fill.size.x = 180.0 * guard
    _guard_fill.color = Color("#df665b") if broken else Color("#91c8e9")
    _guard_state.text = "GUARD BROKEN" if broken else ("GUARD EXPOSED" if guard <= 0.001 else "")
    var ultimate: String = str(data.get("enemy_ultimate", ""))
    var power: String = str(data.get("currentpower", data.get("current_power", "")))
    _ultimate_label.text = ultimate.to_upper() if not ultimate.is_empty() else ""
    _ultimate_label.tooltip_text = power
    _ultimate_label.modulate.a = 1.0 if not ultimate.is_empty() else 0.0
    var pressure: float = clampf(float(data.get("pressure", 60.0)),0.0,100.0)
    _pressure_fill.size.x = 148.0*pressure/100.0
    _pressure_label.text = "PRESSURE " + str(int(pressure))
    _pressure_fill.color=Color("#ef987f") if bool(data.get("pressure_blocked",false)) else Color("#c1b4f2")
    var exposure: float = maxf(0.0,float(data.get("ward_exposure",data.get("exposure",0.0))))
    _exposure_label.text = "WARD EXPOSED " + str(snappedf(exposure,0.1)) + "s" if exposure>0.0 else ""
    _year_label.text = "YEAR " + str(data.get("year", 1000))
    _hint.text = str(data.get("hint", ""))
    var moves: Array[String] = ["cleave", "throw", "reap", "nova"]
    var names: Array = data.get("move_names", ["Crownless Hand", "Borrowed Hour", "Royal Burden", "King’s Ransom"] if int(data.get("phase", 1)) == 1 else ["Hollow Orbit", "Vacant Step", "Unmoored", "Empty Throne"])
    var cooldowns: Dictionary = data.get("cooldowns", {})
    var transformed: bool = int(data.get("phase",1)) == 2
    var tradeoffs: Array[String] = [
        "0 Pressure. Connected body strikes restore Pressure only on actual contact.",
        "28 Pressure. Commit a 200px phase pass; an echo attacks from the old position. No free invulnerability." if transformed else "24 Pressure. A stationary echo records your next hand strike for 3 seconds, then repeats after 0.65 seconds. Enemies can leave its range.",
        "34 Pressure. Lock a lift/repel field. Position and timing matter; it does not universally stun." if transformed else "30 Pressure. Lock a short gravity field: pull, ground dives and move hazards. Enemies can escape or interrupt you.",
        "At least 40 Pressure; spends all. Delayed inward collapse. Long recovery and 2.4 seconds without a ward." if transformed else "At least 40 Pressure; spends all. Chest pressure erupts outward. Long recovery and 2.4 seconds without a ward."
    ]
    for i in range(4):
        var action: String = moves[i]
        var remaining: float = float(cooldowns.get(action, 0.0))
        _move_panels[i].tooltip_text = str(names[i]) + "\n" + tradeoffs[i]
        _move_keys[i].text = binding_label(action)
        _move_labels[i].text = str(snappedf(remaining, 0.1)) if remaining > 0.05 else str(names[i])
        var costs:Array[float]=[0.0,28.0 if transformed else 24.0,34.0 if transformed else 30.0,40.0]
        var ready:bool=remaining<=0.05 and pressure>=costs[i]
        _move_icons[i].texture=ACTOR_SCRIPT.skill_icon(i,2 if transformed else 1)
        _move_icons[i].modulate=Color.WHITE if ready else Color(0.5,0.5,0.5,0.7)
        _move_labels[i].add_theme_color_override("font_color",Color("#f0dba6") if ready else Color("#7d8798"))

func hide_hud() -> void:
    _hud.hide()

func get_bindings() -> Dictionary:
    return _bindings.duplicate()

func binding_label(action: String) -> String:
    var code: int = int(_bindings.get(action, DEFAULT_KEYS.get(action, KEY_NONE)))
    if code == KEY_SPACE:
        return "SPACE"
    if code == KEY_SHIFT:
        return "SHIFT"
    return OS.get_keycode_string(code).to_upper()

func _load_bindings() -> void:
    _bindings = DEFAULT_KEYS.duplicate()
    var config := ConfigFile.new()
    if config.load("user://keybinds.cfg") == OK:
        var used: Dictionary = {}
        for action in ACTIONS:
            var code: int = int(config.get_value("bindings", action, DEFAULT_KEYS[action]))
            if code == KEY_NONE or code == KEY_ENTER or code == KEY_ESCAPE or used.has(code):
                code = int(DEFAULT_KEYS[action])
            _bindings[action] = code
            used[code] = true
    _apply_bindings()

func _apply_bindings() -> void:
    for action in ACTIONS:
        if not InputMap.has_action(action):
            InputMap.add_action(action)
        InputMap.action_erase_events(action)
        var key := InputEventKey.new()
        key.physical_keycode = int(_bindings[action])
        InputMap.action_add_event(action, key)

func _save_bindings() -> void:
    var config := ConfigFile.new()
    for action in ACTIONS:
        config.set_value("bindings", action, _bindings[action])
    config.save("user://keybinds.cfg")

func _input(event: InputEvent) -> void:
    if not (event is InputEventKey):
        return
    var key: InputEventKey = event
    if not key.pressed or key.echo:
        return
    var code: int = int(key.physical_keycode if key.physical_keycode != 0 else key.keycode)
    if not _capturing.is_empty():
        get_viewport().set_input_as_handled()
        if code == KEY_ESCAPE:
            _capturing = ""
            hide_notice()
            return
        if code == KEY_ENTER or code == KEY_KP_ENTER:
            return
        var action: String = _capturing
        var previous: int = int(_bindings[action])
        for other in ACTIONS:
            if other != action and int(_bindings[other]) == code:
                _bindings[other] = previous
        _bindings[action] = code
        _save_bindings()
        _apply_bindings()
        _capturing = ""
        hide_notice()
        show_controls()
        return
    if choosing:
        if code == KEY_UP or code == KEY_DOWN or code == KEY_TAB:
            selected_choice = 1 - selected_choice
            _refresh_choices()
            get_viewport().set_input_as_handled()
        elif code == KEY_ENTER or code == KEY_KP_ENTER:
            _pick(selected_choice == 0)
            get_viewport().set_input_as_handled()
        return
    if reading:
        if code == KEY_ENTER or code == KEY_ESCAPE or code == KEY_SPACE:
            get_viewport().set_input_as_handled()
        return
    if _menu.visible:
        if code == KEY_ESCAPE and _menu_page != "main":
            show_menu(_backdrop_path)
            get_viewport().set_input_as_handled()
        elif code == KEY_ENTER and _menu_page == "main":
            hide_menu()
            play_requested.emit()
            get_viewport().set_input_as_handled()
        elif code == KEY_R and _menu_page == "main":
            show_controls()
            get_viewport().set_input_as_handled()
        elif code == KEY_C and _menu_page == "main":
            show_credits()
            get_viewport().set_input_as_handled()
