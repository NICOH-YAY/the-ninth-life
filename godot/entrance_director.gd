# AI-use disclosure: Codex-authored continuous native sprite entrances with synchronized cinematic/physics handoff.
class_name EntranceDirector
extends Node
var game
var id=""
var stage=""
var danger_count=0
var completed=0
var props:Array=[]
var tweens:Array=[]
var _visitor_idle=false
var _royal_destination=Vector2.ZERO
const IDS=["lantern","breath","tide","fall","grave_gate","blood_gate","shadow","silence","names"]
const BLEND_SECONDS=0.18
func alive(token:int) -> bool:
    return game.epoch==token and game.mode=="entrance"
func _dt() -> float:
    return get_physics_process_delta_time()*(1.8 if game.autoplay else 1.0)
func _visitor_height() -> float:
    return game.Actor.body_height(game.Rules.LIVES[game.life])
func _place_visitor(at:Vector2) -> void:
    at=Vector2(roundf(at.x),minf(game.FLOOR,roundf(at.y)))
    game.visitor.position=at
    game.enemy.x=at.x;game.enemy.y=game.FLOOR-at.y
func _place_king(at:Vector2) -> void:
    at=Vector2(roundf(at.x),minf(game.FLOOR,roundf(at.y)))
    game.king.position=at
    game.boss.x=at.x;game.boss.y=game.FLOOR-at.y
    game.boss.vx=0.0;game.boss.vy=0.0;game.boss.grounded=at.y>=game.FLOOR
func _ambient(dt:float) -> void:
    if _visitor_idle:
        game.enemy.idle_clock=float(game.enemy.get("idle_clock",0.0))+dt
        game.visitor.pose("idle",int(game.enemy.idle_clock*3.5)%6,1,_visitor_height())
    if game.king.current_motion=="rest":
        game.boss.idle_clock=float(game.boss.get("idle_clock",0.0))+dt
        game.king.pose("rest",int(game.boss.idle_clock*1.3)%6,-1,143)
func beat(seconds:float,token:int) -> bool:
    var elapsed:float=0.0
    var duration:float=seconds*(0.55 if game.autoplay else 1.0)
    while elapsed<duration:
        await get_tree().physics_frame
        if not alive(token):return false
        var dt:float=get_physics_process_delta_time()
        elapsed+=dt;_ambient(dt)
    return true
func clear() -> void:
    for tween in tweens:
        if tween.is_valid():tween.kill()
    tweens.clear()
    for node in props:
        if is_instance_valid(node):node.queue_free()
    props.clear();_visitor_idle=false
    if game and game.audio:game.audio.dialogue_duck(false)
func motif(index:int,at:Vector2,width:float=160.0,frame:int=3) -> Sprite2D:
    var sprite=Sprite2D.new()
    sprite.texture=game.Actor.innate_texture(index,frame)
    sprite.texture_filter=CanvasItem.TEXTURE_FILTER_NEAREST
    sprite.position=at+Vector2(0,-58*width/192.0)
    sprite.scale=Vector2.ONE*(width/192.0);sprite.z_index=12
    game.add_child(sprite);props.append(sprite)
    return sprite
func _transition(actor,body:Dictionary,motion:String,facing:int,height:float,token:int) -> bool:
    var elapsed:float=0.0
    while elapsed<BLEND_SECONDS:
        if not alive(token):return false
        actor.pose(motion,mini(5,int(elapsed/BLEND_SECONDS*6)),facing,height)
        await get_tree().physics_frame
        if not alive(token):return false
        elapsed+=_dt();_ambient(get_physics_process_delta_time())
    actor.pose(motion,5,facing,height)
    body.gait_blend=0.0;body.walk_was_moving=false;body.idle_clock=0.0
    return true
func walk_to(target:float,seconds:float,token:int) -> bool:
    _visitor_idle=false
    var facing:int=1 if target>=game.visitor.position.x else -1
    if not await _transition(game.visitor,game.enemy,"start_walk",facing,_visitor_height(),token):return false
    var from:float=game.visitor.position.x
    var timer:float=0.0
    while timer<seconds:
        await get_tree().physics_frame
        if not alive(token):return false
        timer+=_dt()
        var ratio:float=minf(1.0,timer/seconds)
        var eased:float=ratio*ratio*(3.0-2.0*ratio)
        var previous:float=game.enemy.x
        _place_visitor(Vector2(lerpf(from,target,eased),game.FLOOR))
        var distance:float=absf(game.enemy.x-previous)
        var before:float=game.enemy.stride
        game.enemy.stride+=distance
        game.visitor.pose("walk",game.Actor.gait_frame(game.Rules.LIVES[game.life],game.enemy.stride),facing,_visitor_height())
        var half_stride:float=game.Actor.gait_stride(game.Rules.LIVES[game.life])*0.5
        if int(game.enemy.stride/half_stride)>int(before/half_stride):game.audio.sfx("step");game.enemy.steps+=1
        _ambient(get_physics_process_delta_time())
    if not await _transition(game.visitor,game.enemy,"stop_walk",facing,_visitor_height(),token):return false
    _visitor_idle=true
    return true
func _fall_to_floor(seconds:float,token:int) -> bool:
    var from:Vector2=game.visitor.position
    var elapsed:float=0.0
    while elapsed<seconds:
        await get_tree().physics_frame
        if not alive(token):return false
        elapsed+=_dt()
        var ratio:float=minf(1.0,elapsed/seconds)
        _place_visitor(from.lerp(Vector2(from.x,game.FLOOR),ratio*ratio*ratio))
        game.visitor.pose("fall",mini(5,int(ratio*6)),1,_visitor_height())
        _ambient(get_physics_process_delta_time())
    return true
func _descend_throne(token:int) -> bool:
    stage="king-descends"
    var path:Array[Vector2]=[Vector2(840,384),Vector2(817,404),Vector2(800,404),Vector2(783,423),Vector2(770,423),Vector2(751,443),Vector2(738,443),Vector2(724,game.FLOOR),_royal_destination]
    if not await _transition(game.king,game.boss,"start_walk",-1,143,token):return false
    for destination in path:
        var from:Vector2=game.king.position
        var distance:float=from.distance_to(destination)
        if distance<0.5:continue
        var duration:float=maxf(0.07,distance/190.0)
        var elapsed:float=0.0
        var facing:int=-1 if destination.x<from.x else 1
        while elapsed<duration:
            await get_tree().physics_frame
            if not alive(token):return false
            elapsed+=_dt()
            var previous:Vector2=game.king.position
            _place_king(from.lerp(destination,minf(1.0,elapsed/duration)))
            var before:float=game.boss.stride
            game.boss.stride+=previous.distance_to(game.king.position)
            game.king.pose("walk",game.Actor.gait_frame("king",game.boss.stride),facing,143)
            var half_stride:float=game.Actor.gait_stride("king")*0.5
            if int(game.boss.stride/half_stride)>int(before/half_stride):game.audio.sfx("step")
            _ambient(get_physics_process_delta_time())
    var facing:int=-1 if game.visitor.position.x<game.king.position.x else 1
    if not await _transition(game.king,game.boss,"stop_walk",facing,143,token):return false
    return true
func enter(index:int,token:int) -> void:
    clear();id=IDS[index];stage="omen";danger_count=0
    _royal_destination=Vector2(game.boss.x,game.FLOOR)
    game.mode="entrance";game.stage="entrance-"+id
    game.king_shadow.visible=false;game.visitor_shadow.visible=false
    game.enemy.state="wait"
    game.enemy.gait_blend=0.0;game.enemy.walk_was_moving=false;game.enemy.idle_clock=0.0
    game.boss.gait_blend=0.0;game.boss.walk_was_moving=false;game.boss.idle_clock=0.0
    game.visitor.visible=true;game.visitor.modulate=Color.WHITE;game.visitor.rotation=0
    _place_visitor(Vector2(-35,game.FLOOR))
    game.king.who="king";_place_king(game.THRONE);game.king.pose("rest",2,-1,143)
    game.audio.music("years");game.audio.set_tension(0.15)
    if index==0:
        motif(0,Vector2(50,game.FLOOR),90)
        game.audio.sfx("cloth")
        if not await beat(0.45,token):return
        stage="last-warmth"
        if not await walk_to(120,1.3,token):return
    elif index==1:
        game.visitor.visible=false
        for x in [140,310,480]:
            motif(1,Vector2(x,game.FLOOR),120)
            game.audio.sfx("cloth")
            if not await beat(0.22,token):return
        stage="first-breath"
        _place_visitor(Vector2(200,game.FLOOR))
        game.visitor.visible=true
        game.visitor.pose("prepare",5,1,_visitor_height())
        danger_count=1
        game.trauma=3.0
        game.audio.sfx("magic")
        if not await beat(0.65,token):return
    elif index==2:
        _place_visitor(Vector2(230,game.FLOOR))
        game.visitor.modulate.a=0.0
        var tide=motif(2,game.visitor.position,260)
        stage="water-remembers"
        _tween().tween_property(game.visitor,"modulate:a",1.0,1.0)
        for n in range(6):
            tide.texture=game.Actor.innate_texture(2,n)
            if not await beat(0.16,token):return
        danger_count=1
        game.audio.sfx("chain")
    elif index==3:
        _place_visitor(Vector2(690,game.FLOOR-340))
        game.king.pose("rise",3,-1,143)
        game.visitor.pose("jump",2,1,_visitor_height())
        stage="held-fall"
        motif(3,Vector2(690,game.FLOOR),130)
        if not await beat(0.6,token):return
        stage="impact"
        if not await _fall_to_floor(0.42,token):return
        motif(3,game.visitor.position,310,5)
        game.visitor.pose("hurt",4,1,_visitor_height())
        game.audio.sfx("nova");game.trauma=7.0;danger_count=1
        if not await beat(0.55,token):return
    elif index==4:
        game.visitor.visible=false
        for x in [330,490,680]:
            motif(4,Vector2(x,game.FLOOR),155)
            game.audio.sfx("magic")
            if not await beat(0.24,token):return
        stage="grave-knight"
        var knight=Sprite2D.new()
        knight.texture_filter=CanvasItem.TEXTURE_FILTER_NEAREST
        knight.texture=game.Actor.death_knight_texture("idle",0)
        knight.position=Vector2(610,game.FLOOR-96)
        knight.z_index=10
        game.add_child(knight);props.append(knight)
        game.king.pose("rise",5,-1,143)
        for n in range(6):
            knight.texture=game.Actor.death_knight_texture("idle",n)
            if not await beat(0.12,token):return
        stage="throne-near-miss"
        for n in range(6):
            knight.texture=game.Actor.death_knight_texture("slam",n)
            if n==3:
                motif(4,Vector2(760,game.FLOOR),320,5)
                game.audio.pulse("climax");game.trauma=8.0;danger_count=1
            if not await beat(0.09,token):return
        knight.modulate.a=0.30
        _place_visitor(Vector2(90,game.FLOOR))
        game.visitor.visible=true
        if not await walk_to(215,0.8,token):return
    elif index==5:
        _place_visitor(Vector2(-30,game.FLOOR))
        stage="gate-yields"
        game.audio.sfx("metal");game.trauma=4.0
        motif(5,Vector2(90,game.FLOOR),200,5)
        if not await walk_to(170,1.4,token):return
        stage="bloodline"
        motif(5,game.visitor.position,150,4)
        game.visitor.pose("prepare",5,1,_visitor_height())
        danger_count=1
        if not await beat(0.6,token):return
    elif index==6:
        game.visitor.visible=false
        for x in [80,150,220]:
            game.audio.sfx("step")
            var shadow=motif(6,Vector2(x,game.FLOOR),70,2)
            shadow.modulate.a=0.45
            if not await beat(0.24,token):return
        stage="moonlight-body"
        _place_visitor(Vector2(230,game.FLOOR))
        game.visitor.modulate.a=0.0;game.visitor.visible=true
        _tween().tween_property(game.visitor,"modulate:a",1.0,0.6)
        if not await beat(0.7,token):return
    elif index==7:
        _place_visitor(Vector2(190,game.FLOOR))
        stage="bell-cut-short"
        game.audio.dialogue_duck(true)
        game.visitor.pose("prepare",3,1,_visitor_height())
        motif(7,game.visitor.position,210)
        if not await beat(0.9,token):return
        game.audio.dialogue_duck(false)
        stage="silent-step"
        if not await walk_to(250,0.6,token):return
    else:
        _place_visitor(Vector2(70,game.FLOOR))
        stage="nine-scars"
        for n in range(9):
            var memory=motif(8,Vector2(180+n*18,game.FLOOR-45-(n%3)*13),44,n%6)
            memory.modulate.a=0.65
            game.audio.sfx("magic")
            if not await beat(0.08,token):return
        if not await walk_to(220,1.5,token):return
    if not alive(token):return
    if not _visitor_idle:
        if not await _transition(game.visitor,game.enemy,"stop_walk",1,_visitor_height(),token):return
        _visitor_idle=true
    stage="king-rises"
    var rise_start:int=game.king.current_frame+1 if game.king.current_motion=="rise" else 0
    for n in range(rise_start,6):
        game.king.pose("rise",n,-1,143)
        if not await beat(0.055,token):return
    if not await _descend_throne(token):return
    _place_visitor(Vector2(game.visitor.position.x,game.FLOOR));_place_king(_royal_destination)
    game.enemy.state="wait";game.boss.hp=game.boss.max
    game.enemy.gait_blend=0.0;game.enemy.walk_was_moving=false;game.enemy.idle_clock=0.0
    game.boss.gait_blend=0.0;game.boss.walk_was_moving=false;game.boss.idle_clock=0.0
    game.visitor.modulate=Color.WHITE
    # Final stop frame is the new neutral. Root's local idle clock starts here without replaying a rise/walk.
    clear();stage="resolved";completed+=1
func debug_state() -> Dictionary:
    return {"id":id,"stage":stage,"danger_count":danger_count,"completed":completed,"handoff":stage=="resolved","king_gap":game.king.position.distance_to(Vector2(game.boss.x,game.FLOOR-game.boss.y)),"visitor_gap":game.visitor.position.distance_to(Vector2(game.enemy.x,game.FLOOR-game.enemy.y))}
func _tween() -> Tween:
    var tween=game.create_tween().set_process_mode(Tween.TWEEN_PROCESS_PHYSICS)
    tweens.append(tween)
    return tween
