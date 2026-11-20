# AI-use disclosure: Codex authored nine innate-power encounters, sprite hazards and bounded ultimate sequences from Nicoh's direction.
class_name PowerDirector
extends Node

var game: Node
var _life: int = 0
var _casting: bool = false
var _ultimate: bool = false
var _used_ultimate: bool = false
var _elapsed: float = 0.0
var _last_contact: float = 0.0
var _recovery: float = 1.2
var _paid: bool = false
var _hazards: Array[Dictionary] = []
var _history: Array[float] = []
var _history_time: float = 0.0
var _origin: Vector2
var _target: Vector2
var _auxiliary: Sprite2D
var _boost_left: float = 0.0
var _aura: Sprite2D
const FLOOR: float = 464.0
const POWERS = ["The Last Warmth","The Held Breath","The Heavy Dead","The Fall That Waited","The Shared Wound","The Unbent","The Unseen Hand","The Silenced","The Remaining"]
const ULTIMATES = ["A Little Longer","Nothing Left to Breathe","All Who Were Carried","Let Me Catch Them","Give It To Me","This Gate Will Hold","Leave Me Out","Hear Them Once","Bring Them Home"]

func reset(index: int) -> void:
    dispel()
    _life = clampi(index, 0, 8)
    _used_ultimate = false
    _boost_left = 0.0
    _history.clear()
    if game and not game.enemy.is_empty():
        game.enemy.blood_boost = 0.0
        game.enemy.power_count = 0
        game.enemy.ultimate_count = 0
        game.enemy.cost_paid = 0.0

func busy() -> bool:
    return _casting

func can_ultimate() -> bool:
    return game != null and not _casting and not _used_ultimate and not game.enemy.is_empty() and (float(game.enemy.hp) <= float(game.enemy.max) * 0.55 or float(game.combat_clock) >= 18.0)

func cast(ultimate: bool = false) -> bool:
    if game == null or _casting or game.enemy.is_empty() or float(game.enemy.hp) <= 0.0:
        return false
    if ultimate and not can_ultimate():
        return false
    _casting = true
    _ultimate = ultimate
    _used_ultimate = _used_ultimate or ultimate
    _elapsed = 0.0
    _last_contact = 0.0
    _recovery = [1.2,1.1,1.3,1.2,1.4,1.3,1.1,1.4,1.5][_life]
    _paid = false
    _origin = Vector2(float(game.enemy.x),float(game.enemy.y))
    _target = Vector2(float(game.boss.x),float(game.boss.y))
    game.enemy.state = "power_tell"
    game.enemy.windup = 0.0
    game.enemy.ability_t = 0.0
    game.enemy.power_count = int(game.enemy.get("power_count",0)) + 1
    if ultimate:
        game.enemy.ultimate_count = int(game.enemy.get("ultimate_count",0)) + 1
    game.audio.sfx("cloth" if _life in [0,1,6,7] else "magic")
    _build_power()
    return true

func _build_power() -> void:
    var tell: float = 1.25 if _ultimate else 0.88
    var damage: float = float(game.enemy.damage) * (1.15 if _ultimate else 0.80)
    var direction: float = signf(_target.x-_origin.x)
    if direction == 0.0: direction = 1.0
    match _life:
        0:
            var count: int = 5 if _ultimate else 3
            for i in range(count):
                var start: float = clampf(_origin.x + direction * (60.0+i*70.0),40,920)
                _hazard("warmth-wave",start,0,84,44,i*0.43,tell,0.14,damage*0.50,true,{"vx":direction*170.0,"travel":0.50})
        1:
            for i in range(3 if _ultimate else 2):
                var lane: float = clampf(_target.x + (i-1)*155.0,55,905) if _ultimate else clampf(_target.x+i*direction*125.0,55,905)
                _hazard("pressure-pocket",lane,35,105,110,i*0.52,tell,0.10,damage,false)
        2:
            var count: int = 3 if _ultimate else 1
            var center: float = clampf(_target.x,210,750) if _ultimate else _target.x
            for i in range(count):
                var lane: float = center+(i-1)*150.0 if _ultimate else center
                var options: Dictionary = {"memory_actor":"sailor","drowned":true} if _ultimate else {}
                _hazard("burden-crush",lane,0,130 if _ultimate else 115,130,i*0.55,tell+0.25,0.11,damage,false,options)
            for side in [-1,1]:
                _hazard("water-crest",center,0,72,42,1.25 if _ultimate else 0.15,tell+0.25,0.15,damage*0.75,true,{"vx":side*300.0,"travel":0.85})
        3:
            for i in range(3 if _ultimate else 1):
                var lane: float = clampf(_target.x+(i-1)*155.0,75,885) if _ultimate else _target.x
                _hazard("stored-fall",lane,0,92,95,i*(tell+0.38),tell,0.11,damage,false,{"dive":true})
        4:
            _auxiliary = Sprite2D.new()
            _auxiliary.texture = game.Actor.death_knight_texture("emerge",0)
            _auxiliary.position = Vector2(clampf(_target.x,105,855),FLOOR)
            _auxiliary.offset = Vector2(0,-96)
            _auxiliary.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
            _auxiliary.scale = Vector2.ONE * (1.15 if _ultimate else 0.85)
            _auxiliary.z_index = 3
            add_child(_auxiliary)
            for i in range(3 if _ultimate else 1):
                var lane: float = clampf(_target.x+(i-1)*140.0,85,875) if _ultimate else _target.x
                _hazard("grave-knight-slam",lane,0,140,130,i*0.90,tell+0.15,0.10,damage,false)
        5:
            _boost_left = 8.0
            game.enemy.blood_boost = 8.0
            if not is_instance_valid(_aura):
                _aura = Sprite2D.new()
                _aura.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
                _aura.offset = Vector2(0,-58)
                _aura.z_index = 5
                add_child(_aura)
            _update_aura()
            game.enemy.guard_t = tell
            game.enemy.guard_facing = direction
            if _ultimate:
                _hazard("bloodline-crush",_origin.x,0,105,115,0,tell+0.15,0.12,damage*1.25,false,{"vx":direction*390.0,"travel":0.65,"advance":true})
            else:
                _hazard("bloodline-brace",_origin.x+direction*75,0,105,100,0,tell,0.10,damage,false)
        6:
            var positions: Array[float] = []
            for i in range(3):
                var at: int = maxi(0,_history.size()-1-i*5)
                positions.append(_history[at] if not _history.is_empty() else clampf(_origin.x+(i-1)*140.0,40,920))
            # Only the physical, grounded body deals damage. Echoes cannot hit.
            var count: int = 3 if _ultimate else 1
            var real_index: int = int(game.enemy.get("power_count",1)) % 3 if _ultimate else 0
            for i in range(count):
                var real: bool = i == real_index
                var destination: float = clampf(_target.x+direction*30.0,35,925)
                var speed: float = (destination-positions[i])/0.24 if real else 0.0
                _hazard("remembered-body",positions[i],0 if real else 14,90,90,0,tell+0.15,0.11,damage,false,{"real":real,"vx":speed,"travel":0.24 if real else 0.0,"lunge":real})
                if real: game.enemy.x = positions[i]
        7:
            for i in range(4 if _ultimate else 2):
                var low: bool = i%2 == 0
                _hazard("silent-low" if low else "silent-high",_target.x,0 if low else 120,240,38,i*0.62,tell,0.10,damage,low)
        8:
            var count: int = 3 if _ultimate else 2
            for i in range(count):
                var kind: String = ["memory-hold","memory-sweep","memory-heart"][i]
                var lane: float = clampf(_target.x+(i-1)*120.0,65,895)
                var opts: Dictionary = {"vx":direction*210.0,"travel":0.45} if i==1 else {}
                opts["memory_actor"] = ["knight","sailor","alley"][i]
                _hazard(kind,lane,0 if i<2 else 48,130 if i<2 else 80,45 if i<2 else 100,i*0.83,tell,0.10,damage*(1.15 if i==2 else 0.75),i<2,opts)

func _hazard(kind: String, x: float, y: float, width: float, height: float, delay: float, tell: float, active: float, damage: float, low: bool, options: Dictionary = {}) -> void:
    var sprite := Sprite2D.new()
    sprite.texture = game.Actor.innate_texture(_life,0)
    sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
    sprite.position = Vector2(x,FLOOR-y)
    sprite.offset = Vector2(0,-58)
    sprite.scale = Vector2.ONE * maxf(0.48,width/192.0)
    sprite.modulate.a = 0.45
    sprite.z_index = 4
    add_child(sprite)
    var item: Dictionary = {"kind":kind,"x":x,"origin_x":x,"y":y,"width":width,"height":height,"delay":delay,"tell":tell,"active":active,"damage":damage,"low":low,"hit":false,"fired":false,"real":true,"time":-delay,"sprite":sprite,"vx":0.0,"travel":0.0}
    item.merge(options,true)
    if options.has("memory_actor"):
        var memory := Sprite2D.new()
        memory.texture = game.Actor.texture_for(str(options.memory_actor),"idle",0)
        memory.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
        memory.offset = Vector2(0,-38)
        memory.position = Vector2(x,FLOOR)
        memory.modulate.a = 0.45
        memory.z_index = 3
        add_child(memory)
        item["body"] = memory
    _hazards.append(item)
    _last_contact = maxf(_last_contact,delay+tell+active+float(item.travel))

func tick(dt: float) -> void:
    if game == null or game.enemy.is_empty(): return
    _history_time += dt
    if _history_time >= 0.12:
        _history_time = 0.0
        _history.append(float(game.enemy.x))
        if _history.size()>35: _history.pop_front()
    _boost_left = maxf(0,_boost_left-dt)
    game.enemy.blood_boost = _boost_left
    _update_aura()
    if not _casting: return
    if float(game.enemy.hp)<=0:
        dispel()
        return
    _elapsed += dt
    var any_active: bool = false
    var auxiliary_selected: bool = false
    for item in _hazards:
        item.time = float(item.time)+dt
        var t: float = item.time
        var sprite: Sprite2D = item.sprite
        sprite.visible = t>=0 and t<float(item.tell)+float(item.active)+float(item.travel)+0.22
        if item.has("body") and is_instance_valid(item.body): item.body.visible=sprite.visible
        if not sprite.visible: continue
        var contact: float = t-float(item.tell)
        var active_time: float = float(item.active)+float(item.travel)
        var live: bool = contact>=0 and contact<=active_time
        any_active = any_active or live
        if contact>=0 and not item.fired:
            item.fired=true
            game.audio.sfx("wood" if _life==0 else "ice" if _life==7 else "chain" if _life in [2,4] else "sword" if _life==6 else "magic")
            game.trauma=maxf(float(game.trauma),3.0 if not _ultimate else 6.0)
        if contact>=0:
            item.x=clampf(float(item.origin_x)+float(item.vx)*minf(contact,float(item.travel)),20,940)
        sprite.position=Vector2(float(item.x),FLOOR-float(item.y))
        var frame: int = clampi(int(t/maxf(0.1,float(item.tell))*3.0),0,2) if contact<0 else clampi(3+int(contact*16),3,5)
        sprite.texture=game.Actor.innate_texture(_life,frame)
        sprite.modulate.a=0.45 if contact<0 else (1.0 if bool(item.real) else 0.28)
        if item.has("body"):
            var memory: Sprite2D = item.body
            memory.visible = sprite.visible
            var drowned: bool = bool(item.get("drowned",false))
            var fall_progress: float = clampf((t-(float(item.tell)-0.25))/0.25,0,1)
            var elevation: float = 170.0*(1.0-fall_progress*fall_progress) if drowned else 0.0
            memory.position = Vector2(float(item.x),FLOOR-elevation)
            memory.modulate.a = (0.32 if contact<0 else 0.55) if drowned else (0.40 if contact<0 else 0.90)
            var motion: String = "hurt" if drowned else "guard" if item.kind=="memory-hold" else "cleave" if item.kind=="memory-sweep" else "throw"
            memory.texture = game.Actor.texture_for(str(item.memory_actor),"idle" if contact<0 else motion,frame)
        if live and (bool(item.get("advance",false)) or bool(item.get("lunge",false))):
            game.enemy.x=float(item.x)
        if live and bool(item.real) and not bool(item.hit):
            var boss_foot: float = game.boss.y
            var overlaps_body: bool = boss_foot <= float(item.y)+float(item.height) and boss_foot+85.0 >= float(item.y)
            if absf(float(game.boss.x)-float(item.x))<=float(item.width)*0.5+12 and overlaps_body:
                item.hit=true
                game._hurt_boss(float(item.damage),bool(item.low),{"impulse":340.0 if _ultimate else 210.0,"lift":0.0})
                if not _casting: return
                if item.kind=="memory-hold":
                    game.boss.bound = maxf(float(game.boss.get("bound",0.0)),0.65)
        if bool(item.get("dive",false)): _dive_body(item)
        if is_instance_valid(_auxiliary) and not auxiliary_selected and item.kind=="grave-knight-slam" and t>=0 and contact<active_time+0.22:
            auxiliary_selected=true
            _auxiliary.position.x=float(item.x)
            _auxiliary.texture=game.Actor.death_knight_texture("tell" if contact<0 else "slam",clampi(int((t/float(item.tell))*5) if contact<0 else int(contact*30),0,5))
    game.enemy.power_motion = "cast" if any_active else "prepare"
    game.enemy.power_frame = clampi(int(_elapsed*8)%6,0,5)
    if _elapsed>=_last_contact:
        if not _paid: _pay_cost()
        game.enemy.power_motion = "hurt"
        game.enemy.power_frame = clampi(int((_elapsed-_last_contact)*4),0,5)
        game.enemy.state="power_recover"
    else:
        game.enemy.state="power_active" if any_active else "power_tell"
    if _elapsed>=_last_contact+_recovery:
        _finish()

func _update_aura() -> void:
    if _boost_left<=0:
        if is_instance_valid(_aura): _aura.queue_free()
        _aura=null
        return
    if not is_instance_valid(_aura): return
    _aura.position=Vector2(float(game.enemy.x),FLOOR-float(game.enemy.y))
    _aura.texture=game.Actor.innate_texture(5,3+int((8.0-_boost_left)*8)%3)
    _aura.modulate.a=0.58+0.18*sin((8.0-_boost_left)*8.0)

func _dive_body(item: Dictionary) -> void:
    var t: float = item.time
    var tell: float = item.tell
    if t<0 or t>tell+0.15: return
    game.enemy.vy=0.0
    if t<tell-0.22:
        game.enemy.y=120.0+40.0*sin(clampf(t/tell,0,1)*PI)
    else:
        var progress: float=clampf((t-(tell-0.22))/0.22,0,1)
        game.enemy.x=lerpf(_origin.x,float(item.x),progress)
        game.enemy.y=lerpf(135.0,0.0,progress)
    if t>=tell: game.enemy.y=0.0

func _pay_cost() -> void:
    _paid=true
    var before: float=game.enemy.hp
    var fraction: float=0.045 if _ultimate else 0.018
    game.enemy.hp=maxf(1.0,before-float(game.enemy.max)*fraction)
    game.enemy.cost_paid=float(game.enemy.get("cost_paid",0.0))+before-float(game.enemy.hp)
    game.enemy.flash=0.18
    game.enemy.guard_t=0.0
    game._blood(Vector2(float(game.enemy.x),FLOOR-float(game.enemy.y)-42))
    game.audio.sfx("cloth" if _life==0 else "flesh")
    if _ultimate: game.audio.pulse("climax")
    if _life==3:
        game.enemy.y=0.0
        game.enemy.vy=0.0

func _finish() -> void:
    _casting=false
    _clear_hazards()
    if game and not game.enemy.is_empty():
        game.enemy.erase("power_motion")
        game.enemy.erase("power_frame")
    if game and not game.enemy.is_empty() and game.enemy.state in ["power_tell","power_active","power_recover"]:
        game.enemy.state="wait"
        game.enemy.t=0.15
        game.enemy.windup=0.0

func dispel() -> void:
    _boost_left=0.0
    if is_instance_valid(_aura): _aura.queue_free()
    _aura=null
    if game and not game.enemy.is_empty(): game.enemy.blood_boost=0.0
    _casting=false
    _clear_hazards()
    if game and not game.enemy.is_empty():
        game.enemy.erase("power_motion")
        game.enemy.erase("power_frame")
        game.enemy.ability_t=0.0
        if game.enemy.state in ["power_tell","power_active","power_recover"]:
            game.enemy.state="wait"
            game.enemy.t=0.15

func _clear_hazards() -> void:
    for item in _hazards:
        if is_instance_valid(item.sprite): item.sprite.queue_free()
        if item.has("body") and is_instance_valid(item.body): item.body.queue_free()
    _hazards.clear()
    if is_instance_valid(_auxiliary): _auxiliary.queue_free()
    _auxiliary=null

func debug_state() -> Dictionary:
    var states: Array[Dictionary]=[]
    for item in _hazards:
        states.append({"kind":item.kind,"x":item.x,"y":item.y,"width":item.width,"height":item.height,"tell":maxf(0,float(item.tell)-float(item.time)),"active":float(item.time)>=float(item.tell) and float(item.time)<=float(item.tell)+float(item.active)+float(item.travel),"low":item.low,"real":item.real,"memory_actor":item.get("memory_actor",""),"body_visible":item.has("body") and is_instance_valid(item.body) and item.body.visible,"lunge":item.get("lunge",false),"drowned":item.get("drowned",false)})
    return {"power":POWERS[_life],"ultimate":ULTIMATES[_life],"busy":_casting,"casting_ultimate":_ultimate and _casting,"ultimate_used":_used_ultimate,"elapsed":_elapsed,"recovery":_recovery,"recovering":_casting and _elapsed>=_last_contact,"blood_boost":_boost_left,"blood_aura":is_instance_valid(_aura),"auxiliary":is_instance_valid(_auxiliary),"hazards":states}

func _exit_tree() -> void:
    _clear_hazards()
    if is_instance_valid(_aura): _aura.queue_free()
    _aura=null
