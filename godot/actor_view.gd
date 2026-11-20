# AI-use disclosure: Codex-authored native Godot sprite presentation using attributed pixel atlases.
class_name ActorView
extends Node2D

const LIVES: Array[String] = ["kitten","alley","sailor","acrobat","witch","knight","thief","quiet","patchwork"]
const BODY_HEIGHTS: Array[float] = [74.0,80.0,71.0,69.0,76.0,79.0,71.0,76.0,85.0]
const ROWS: Dictionary = {"idle":0,"run":1,"walk":1,"jump":2,"fall":2,"dash":3,"cleave":4,"strike":4,"throw":5,"thrust":5,"reap":6,"kneel":6,"nova":7,"cast":7,"hurt":2}
static var _cache: Dictionary = {}
static var _images: Dictionary = {}
var who: String = "player"
var sprite: Sprite2D
var foot_origin: Vector2 = Vector2(96,154)
var visible_body_height: float = 143.0
var source_body_height: float = 107.0

func _ready() -> void:
    _ensure_sprite()

func _ensure_sprite() -> void:
    if is_instance_valid(sprite):
        return
    texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
    sprite = Sprite2D.new()
    sprite.name = "ActorSprite"
    sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
    add_child(sprite)

func setup(actor: String) -> void:
    who = actor
    _ensure_sprite()
    pose("idle",0,-1 if _is_king(actor) else 1,143.0 if _is_king(actor) else 78.0)

func pose(motion: String, frame: int, facing: int, height: float) -> void:
    _ensure_sprite()
    var d: Dictionary = _descriptor(who,motion,frame)
    var cell: int = int(d.cell)
    foot_origin = Vector2(float(cell) * 0.5,float(d.foot))
    source_body_height = float(d.body)
    visible_body_height = height
    sprite.texture = texture_for(who,motion,frame)
    sprite.position = Vector2(0.0,float(cell) * 0.5 - float(d.foot))
    sprite.flip_h = facing > 0 if bool(d.left) else facing < 0
    var amount: float = height / maxf(1.0,source_body_height)
    scale = Vector2(amount,amount)
    sprite.rotation = 0.0
    if motion == "hurt":
        sprite.rotation = deg_to_rad(float(-facing) * 8.0)
    # The second stance preserves the feline king, his sword and silhouette.
    sprite.modulate = Color(1.0,0.94,0.75,1.0) if who in ["ascended","king_aoe","immortal-ascended"] else Color.WHITE

static func _is_king(actor: String) -> bool:
    return actor in ["player","king","immortal-base","ascended","king_aoe","immortal-ascended","rest","previous"]

static func _descriptor(actor: String, motion: String, frame: int) -> Dictionary:
    var f: int = clampi(frame,0,5)
    if actor == "previous":
        var row: int = 0 if motion in ["idle","run","walk"] else 1 if motion in ["cleave","strike","thrust"] else 3 if motion == "dash" else 2
        return {"path":"res://art/previous.png","cell":96,"foot":94,"body":86.0,"frame":row*6+f,"left":true}
    if _is_king(actor) and (motion in ["rest","sit","wait","rise"] or (actor == "rest" and motion == "idle")):
        var waiting_row: int = 1 if motion == "rise" else 0
        return {"path":"res://art/waiting.png","cell":192,"foot":154,"body":107.0,"frame":waiting_row*6+f,"left":true}
    if _is_king(actor):
        var row: int = int(ROWS.get(motion,0))
        if actor == "rest" and motion == "idle":
            row = 6
            f = 2 + floori(float(f) / 4.0)
        if motion == "hurt":
            f = 5
        return {"path":"res://art/king.png","cell":192,"foot":154,"body":107.0,"frame":row*6+f,"left":true}
    var row: int = maxi(0,LIVES.find(actor))
    var path: String = "res://art/visitors-combat.png"
    var pose_frame: int = f
    if motion in ["run","walk"]:
        path = "res://art/visitors-walk.png"
    elif motion in ["idle","hurt"]:
        path = "res://art/visitors-idle-hurt.png"
        pose_frame = f % 3 if motion == "idle" else 3 + f % 3
    return {"path":path,"cell":144,"foot":110,"body":BODY_HEIGHTS[row],"frame":row*6+pose_frame,"left":false}

static func _region(path: String, cell: Vector2i, frame: int, cols: int = 6) -> Texture2D:
    var key: String = path + ":" + str(cell) + ":" + str(frame)
    if _cache.has(key):
        return _cache[key] as Texture2D
    var sheet: Texture2D = load(path) as Texture2D
    if sheet == null:
        return null
    var atlas: AtlasTexture = AtlasTexture.new()
    atlas.atlas = sheet
    atlas.region = Rect2(float((frame % cols) * cell.x),float(floori(float(frame) / float(cols)) * cell.y),float(cell.x),float(cell.y))
    atlas.filter_clip = true
    _cache[key] = atlas
    return atlas

static func texture_for(actor: String, motion: String = "idle", frame: int = 0) -> Texture2D:
    var d: Dictionary = _descriptor(actor,motion,frame)
    return _region(str(d.path),Vector2i(int(d.cell),int(d.cell)),int(d.frame))

static func portrait_texture(actor: String) -> Texture2D:
    var d: Dictionary = _descriptor(actor,"idle",0)
    var key: String = "portrait:" + actor
    if _cache.has(key):
        return _cache[key] as Texture2D
    var path: String = str(d.path)
    var sheet: Texture2D = load(path) as Texture2D
    if sheet == null:
        return null
    if not _images.has(path):
        _images[path] = sheet.get_image()
    var pixels: Image = _images[path] as Image
    var cell: int = int(d.cell)
    var index: int = int(d.frame)
    var x0: int = (index % 6) * cell
    var y0: int = floori(float(index) / 6.0) * cell
    var top: int = int(d.foot) - int(d.body)
    var found: bool = false
    for y in range(0,int(d.foot)):
        for x in range(int(cell*0.32),int(cell*0.68)):
            if pixels.get_pixel(x0+x,y0+y).a > 0.5:
                top = y
                found = true
                break
        if found:
            break
    var size: int = maxi(24,int(float(d.body)*0.60))
    var left: int = clampi(int(float(cell)*0.5-float(size)*0.5),0,cell-size)
    var upper: int = clampi(top-2,0,cell-size)
    var atlas: AtlasTexture = AtlasTexture.new()
    atlas.atlas = sheet
    atlas.region = Rect2(x0+left,y0+upper,size,size)
    atlas.filter_clip = true
    _cache[key] = atlas
    return atlas

static func effect_texture(row: int, frame: int, kind: String = "royal") -> Texture2D:
    var path: String = "res://art/effects.png"
    var rows: int = 8
    if kind in ["nova","legacy"]:
        path = "res://art/royal-effects.png"
        rows = 5
    elif kind in ["visitor","enemy"]:
        path = "res://art/visitor-effects.png"
    elif kind in ["blood","impact"]:
        path = "res://art/blood.png"
        rows = 2
    return _region(path,Vector2i(128,128),clampi(row,0,rows-1)*6+clampi(frame,0,5))

static func coronation_texture(frame: int) -> Texture2D:
    return _region("res://art/coronation.png",Vector2i(192,192),clampi(frame,0,11))

static func finisher_texture(frame: int) -> Texture2D:
    return _region("res://art/held-impalement.png",Vector2i(320,256),clampi(frame,0,11))

static func skill_icon(index: int) -> Texture2D:
    return _region("res://art/skill-icons.png",Vector2i(32,32),clampi(index,0,3),4)
