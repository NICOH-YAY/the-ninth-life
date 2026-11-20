# AI-use disclosure: Codex-authored distinct native sprite entrances for the returning victims.
class_name EntranceDirector
extends Node

var game
var id=""
var stage=""
var danger_count=0
var completed=0
var props:Array=[]
var tweens:Array=[]
const IDS=["lantern","breath","tide","fall","grave_gate","blood_gate","shadow","silence","names"]

func alive(token:int) -> bool:
    return game.epoch==token and game.mode=="entrance"

func beat(seconds:float,token:int) -> bool:
    await game._pause(seconds*(0.55 if game.autoplay else 1.0))
    return alive(token)

func clear() -> void:
    for tween in tweens:
        if tween.is_valid():tween.kill()
    tweens.clear()
    for node in props:
        if is_instance_valid(node):node.queue_free()
    props.clear()

func motif(index:int,at:Vector2,width:float=160.0,frame:int=3) -> Sprite2D:
    var sprite=Sprite2D.new()
    sprite.texture=game.Actor.innate_texture(index,frame)
    sprite.texture_filter=CanvasItem.TEXTURE_FILTER_NEAREST
    sprite.position=at+Vector2(0,-58*width/192.0)
    sprite.scale=Vector2.ONE*(width/192.0)
    sprite.z_index=12
    game.add_child(sprite)
    props.append(sprite)
    return sprite

func walk_to(target:float,seconds:float,token:int) -> bool:
    var from:float=game.visitor.position.x
    var timer=0.0
    while timer<seconds:
        await get_tree().physics_frame
        if not alive(token):return false
        timer+=game.get_physics_process_delta_time()*(1.8 if game.autoplay else 1.0)
        var previous:float=game.visitor.position.x
        game.visitor.position.x=lerpf(from,target,minf(1,timer/seconds))
        game.enemy.stride+=absf(game.visitor.position.x-previous)
        game.visitor.pose("walk",int(game.enemy.stride/7.0)%12,1,61 if game.life==0 else 78)
        if int(game.enemy.stride/42.0)>int((game.enemy.stride-absf(game.visitor.position.x-previous))/42.0):
            game.audio.sfx("step");game.enemy.steps+=1
    return true

func enter(index:int,token:int) -> void:
    clear()
    id=IDS[index]
    stage="omen"
    danger_count=0
    game.mode="entrance"
    game.king_shadow.visible=false;game.visitor_shadow.visible=false
    game.stage="entrance-"+id
    game.enemy.state="wait"
    game.visitor.visible=true
    game.visitor.modulate=Color.WHITE
    game.visitor.rotation=0
    game.visitor.position=Vector2(-35,game.FLOOR)
    game.king.who="king"
    game.king.position=game.THRONE
    game.king.pose("rest",2,-1,143)
    game.audio.music("years")
    game.audio.set_tension(0.15)
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
        game.visitor.position=Vector2(200,game.FLOOR)
        game.visitor.visible=true
        game.visitor.pose("prepare",5,1,78)
        danger_count=1
        game.trauma=3.0
        game.audio.sfx("magic")
        if not await beat(0.65,token):return
    elif index==2:
        game.visitor.position=Vector2(230,game.FLOOR)
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
        game.visitor.position=Vector2(690,game.FLOOR-340)
        game.king.pose("rise",3,-1,143)
        game.visitor.pose("jump",2,1,78)
        stage="held-fall"
        motif(3,Vector2(690,game.FLOOR),130)
        if not await beat(0.6,token):return
        stage="impact"
        _tween().set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_IN).tween_property(game.visitor,"position:y",game.FLOOR,0.38)
        if not await beat(0.42,token):return
        motif(3,game.visitor.position,310,5)
        game.visitor.pose("hurt",4,1,78)
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
        game.visitor.position=Vector2(90,game.FLOOR)
        game.visitor.visible=true
        if not await walk_to(215,0.8,token):return
    elif index==5:
        game.visitor.position=Vector2(-30,game.FLOOR)
        stage="gate-yields"
        game.audio.sfx("metal");game.trauma=4.0
        motif(5,Vector2(90,game.FLOOR),200,5)
        if not await walk_to(170,1.4,token):return
        stage="bloodline"
        motif(5,game.visitor.position,150,4)
        game.visitor.pose("prepare",5,1,78)
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
        game.visitor.position=Vector2(230,game.FLOOR)
        game.visitor.modulate.a=0.0;game.visitor.visible=true
        _tween().tween_property(game.visitor,"modulate:a",1.0,0.6)
        if not await beat(0.7,token):return
    elif index==7:
        game.visitor.position=Vector2(190,game.FLOOR)
        stage="bell-cut-short"
        game.audio.dialogue_duck(true)
        game.visitor.pose("prepare",3,1,78)
        motif(7,game.visitor.position,210)
        if not await beat(0.9,token):return
        game.audio.dialogue_duck(false)
        stage="silent-step"
        if not await walk_to(250,0.6,token):return
    else:
        game.visitor.position=Vector2(70,game.FLOOR)
        stage="nine-scars"
        for n in range(9):
            var memory=motif(8,Vector2(180+n*18,game.FLOOR-45-(n%3)*13),44,n%6)
            memory.modulate.a=0.65
            game.audio.sfx("magic")
            if not await beat(0.08,token):return
        if not await walk_to(220,1.5,token):return
    if not alive(token):return
    stage="king-rises"
    var rise_start:int=game.king.current_frame+1 if game.king.current_motion=="rise" else 0
    for n in range(rise_start,6):
        game.king.pose("rise",n,-1,143)
        if not await beat(0.055,token):return
    var from:Vector2=game.king.position
    var travel=0.0
    while travel<0.65:
        await get_tree().physics_frame
        if not alive(token):return
        travel+=game.get_physics_process_delta_time()*(1.8 if game.autoplay else 1.0)
        game.king.position=from.lerp(Vector2(game.boss.x,game.FLOOR),minf(1,travel/0.65))
        game.king.pose("walk",int(travel*18)%12,-1,143)
    game.enemy.x=game.visitor.position.x
    game.enemy.y=0.0
    game.enemy.state="wait"
    game.boss.hp=game.boss.max
    game.king.position=Vector2(game.boss.x,game.FLOOR)
    game.king.pose("idle",0,-1,143)
    game.visitor.modulate=Color.WHITE
    game.visitor.pose("idle",0,1,61 if index==0 else 78)
    clear()
    stage="resolved"
    completed+=1

func debug_state() -> Dictionary:
    return {"id":id,"stage":stage,"danger_count":danger_count,"completed":completed}

func _tween() -> Tween:
    var tween=game.create_tween()
    tweens.append(tween)
    return tween
