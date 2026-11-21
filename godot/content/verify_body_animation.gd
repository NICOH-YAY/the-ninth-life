# AI-use disclosure: Codex-authored isolated verification of actual walk and anticipation atlas pixels.
extends SceneTree

const ACTOR = preload("res://actor_view.gd")
const VISITORS: Array[String] = ["kitten", "alley", "sailor", "acrobat", "witch", "knight", "thief", "quiet", "patchwork"]
const KING_PREPARATIONS: Array[String] = ["prepare_cleave_0", "prepare_cleave_1", "prepare_cleave_2", "prepare_throw", "prepare_reap", "prepare_nova"]
var checks: int = 0
var failures: Array[String] = []
var sequences: Array[Dictionary] = []
var sheets: Dictionary = {}

func _initialize() -> void:
    call_deferred("_run")

func check(condition: bool, description: String) -> void:
    checks += 1
    if not condition:
        failures.append(description)
        push_error(description)

func sequence(actor: String, motion: String, frame_total: int = 6) -> void:
    check(ACTOR.frame_count(actor, motion) == frame_total, actor + ": " + motion + " must expose the intended frame count.")
    var hashes: Dictionary = {}
    var regions: Dictionary = {}
    var anchors: Array[int] = []
    for frame in range(frame_total):
        var descriptor: Dictionary = ACTOR._descriptor(actor, motion, frame)
        var path: String = str(descriptor.path)
        if VISITORS.has(actor) and motion in ["walk","run","start_walk","stop_walk","idle"]:
            check(path == "res://art/gait-"+actor+"-v11.png", actor + ": gait and neutral must come from that visitor's own new body sheet.")
        if not sheets.has(path):
            var sheet_texture: Texture2D = load(path)
            check(sheet_texture != null, actor + ": " + motion + " sheet must load.")
            if sheet_texture == null:
                return
            var image: Image = sheet_texture.get_image()
            if image.is_compressed():
                check(image.decompress() == OK, path + " image must decompress for actual-pixel verification.")
            sheets[path] = image
        var texture: AtlasTexture = ACTOR.texture_for(actor, motion, frame) as AtlasTexture
        check(texture != null, actor + ": " + motion + " must use a real atlas region.")
        if texture == null:
            return
        var region: Rect2i = Rect2i(texture.region)
        var crop: Image = (sheets[path] as Image).get_region(region)
        check(not crop.is_empty(), actor + ": " + motion + " frame must contain image data.")
        hashes[crop.get_data().hex_encode().sha256_text()] = true
        regions[path + ":" + str(region)] = true
        var foot: int = int(descriptor.foot)
        var bottom: int = -1
        # The central lower body excludes a wide blade/tail; one support foot remains on the shared baseline.
        for y in range(crop.get_height()):
            for x in range(floori(crop.get_width() * 0.34), ceili(crop.get_width() * 0.66)):
                if crop.get_pixel(x, y).a > 0.5:
                    bottom = maxi(bottom, y)
        anchors.append(bottom - foot + 1)
        if actor != "ascended" and (motion in ["walk","run","idle","start_walk","stop_walk"] or motion.begins_with("prepare")):
            check(bottom >= foot - 5 and bottom <= foot + 3, actor + ": " + motion + " frame " + str(frame) + " must keep a physical support foot on its baseline (delta " + str(bottom - foot + 1) + ").")
        else:
            check(bottom >= 0 and foot > 0 and foot < crop.get_height(), actor + ": " + motion + " must retain a valid body anchor.")
    check(hashes.size() == frame_total, actor + ": " + motion + " must contain " + str(frame_total) + " different drawn pixel frames, not repeated metadata.")
    check(regions.size() == frame_total, actor + ": " + motion + " must select " + str(frame_total) + " different atlas regions.")
    sequences.append({"actor": actor, "motion": motion, "unique_pixel_frames": hashes.size(), "unique_regions": regions.size(), "foot_offsets": anchors})

func _run() -> void:
    var walkers: Array[String] = ["king", "ascended", "previous"]
    walkers.append_array(VISITORS)
    for actor in walkers:
        sequence(actor, "walk", 12)
    sequence("king", "idle", 6)
    sequence("ascended", "idle", 12)
    for actor in ["king", "ascended"]:
        for motion in KING_PREPARATIONS:
            sequence(actor, motion, 6)
    for motion in ["combo_0","combo_1","combo_2","throw"]:
        sequence("king", motion, 12)
        sequence("ascended", motion, 6)
    for actor in ["king","ascended"]:
        sequence(actor, "reap", 6)
        sequence(actor, "nova", 6)
    var strides: Dictionary = {}
    for actor in VISITORS:
        var stride: float = ACTOR.gait_stride(actor)
        strides[stride] = true
        check(stride > 0 and ACTOR.gait_frame(actor, 0) == 0, actor + ": the distance-based gait starts at its own contact.")
        check(ACTOR.gait_frame(actor, stride*0.5) == 6, actor + ": opposite foot contact occurs after half its own stride.")
        check(ACTOR.gait_frame(actor, stride) == 0, actor + ": one individual stride completes the full twelve-pose cycle.")
        sequence(actor, "prepare")
        sequence(actor, "start_walk", 6)
        sequence(actor, "stop_walk", 6)
        sequence(actor, "idle", 1)
    for actor in VISITORS:
        var view = ACTOR.new()
        root.add_child(view);view.setup(actor)
        view.pose("walk",7,1,ACTOR.body_height(actor))
        var moving_texture: Texture2D = view.sprite.texture
        view.pose("stop_walk",0,1,ACTOR.body_height(actor))
        check(view.sprite.texture == moving_texture, actor + ": stopping begins with the exact last rendered gait pose instead of jumping to a generic leg position.")
        view.pose("stop_walk",5,1,ACTOR.body_height(actor))
        var neutral: AtlasTexture = view.sprite.texture as AtlasTexture
        var neutral_scale: Vector2 = view.scale
        view.pose("idle",0,1,ACTOR.body_height(actor))
        var resting: AtlasTexture = view.sprite.texture as AtlasTexture
        check(neutral.atlas == resting.atlas and neutral.region == resting.region and neutral_scale == view.scale, actor + ": completed stop and idle share the exact neutral source and integer body size.")
        view.queue_free()
    await process_frame
    check(strides.size() == VISITORS.size(), "Nine visitors must retain independent stride lengths instead of a shared gait clock.")
    print(JSON.stringify({"ok": failures.is_empty(), "checks": checks, "sequences": sequences, "failures": failures}))
    ACTOR._cache.clear()
    ACTOR._images.clear()
    sheets.clear()
    await process_frame
    quit(0 if failures.is_empty() else 1)
