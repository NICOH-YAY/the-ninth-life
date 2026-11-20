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

func sequence(actor: String, motion: String) -> void:
    var hashes: Dictionary = {}
    var regions: Dictionary = {}
    var anchors: Array[int] = []
    for frame in range(6):
        var descriptor: Dictionary = ACTOR._descriptor(actor, motion, frame)
        var path: String = str(descriptor.path)
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
        check(bottom >= foot - 5 and bottom <= foot + 3, actor + ": " + motion + " frame " + str(frame) + " must keep a physical foot on its baseline (delta " + str(bottom - foot + 1) + ").")
    check(hashes.size() == 6, actor + ": " + motion + " must contain six different drawn pixel frames, not repeated metadata.")
    check(regions.size() == 6, actor + ": " + motion + " must select six different atlas regions.")
    sequences.append({"actor": actor, "motion": motion, "unique_pixel_frames": hashes.size(), "unique_regions": regions.size(), "foot_offsets": anchors})

func _run() -> void:
    var walkers: Array[String] = ["king", "ascended", "previous"]
    walkers.append_array(VISITORS)
    for actor in walkers:
        sequence(actor, "walk")
    for actor in ["king", "ascended"]:
        for motion in KING_PREPARATIONS:
            sequence(actor, motion)
    for actor in VISITORS:
        sequence(actor, "prepare")
    print(JSON.stringify({"ok": failures.is_empty(), "checks": checks, "sequences": sequences, "failures": failures}))
    ACTOR._cache.clear()
    ACTOR._images.clear()
    sheets.clear()
    await process_frame
    quit(0 if failures.is_empty() else 1)
