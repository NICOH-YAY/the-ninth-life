# AI-use disclosure: Codex authored body-bound royal magic, finite Pressure and positional interactions.
class_name RoyalMagic
extends Node
var game
var pressure: float = 60.0
var strain: float = 0.0
var dry: float = 0.0
var echo_arm: Dictionary = {}
var echoes: Array[Dictionary] = []
var field: Dictionary = {}
var vfx: Array[Dictionary] = []
var interactions: Dictionary = {"echo_hits":0,"groundings":0,"redirects":0,"bursts":0,"flanks":0}
var _reserved: float = 0.0
var arm_sprite: Sprite2D
var _echo_clock: float = 0.0
var _regen_delay: float = 0.0

func reset() -> void:
    clear()
    pressure=60.0;strain=0.0;dry=0.0;_regen_delay=0.0
    interactions={"echo_hits":0,"groundings":0,"redirects":0,"bursts":0,"flanks":0}

func clear() -> void:
    for item in vfx:
        if is_instance_valid(item.sprite):item.sprite.queue_free()
    vfx.clear()
    if field.has("sprite") and is_instance_valid(field.sprite):field.sprite.queue_free()
    field.clear();echo_arm.clear()
    if is_instance_valid(arm_sprite):arm_sprite.queue_free()
    arm_sprite=null
    for e in echoes:
        if is_instance_valid(e.sprite):e.sprite.queue_free()
    echoes.clear()

func gain(amount: float) -> void:
    pressure=minf(100.0,pressure+amount)

func cost(id: String, phase: int) -> float:
    if id=="cleave":return 0.0
    if id=="throw":return 28.0 if phase==2 else 24.0
    if id=="reap":return 34.0 if phase==2 else 30.0
    return maxf(40.0,pressure)

func can_cast(id: String, phase: int) -> bool:
    return pressure+0.001>=cost(id,phase)

func begin(id: String, phase: int) -> bool:
    if not can_cast(id,phase):
        dry=0.65
        return false
    _reserved=cost(id,phase)
    pressure=maxf(0.0,pressure-_reserved)
    _regen_delay=0.75 if id!="cleave" else _regen_delay
    return true

func wounded() -> void:
    _regen_delay=1.4
    if field.has("sprite") and is_instance_valid(field.sprite):field.sprite.queue_free()
    field.clear()
    # A recalled body can still finish its already committed action.

func _sprite(actor: String, motion: String, frame: int, at: Vector2, alpha: float=0.65) -> Sprite2D:
    var s:=Sprite2D.new()
    s.texture=game.Actor.texture_for(actor,motion,frame)
    s.texture_filter=CanvasItem.TEXTURE_FILTER_NEAREST
    s.position=Vector2(at.x,game.FLOOR-at.y)
    s.offset=Vector2(0,-58)
    s.modulate=Color(0.54,0.88,1.0,alpha)
    s.z_index=7
    add_child(s)
    return s

func _effect(row:int,at:Vector2,width:float,duration:float=0.32) -> void:
    var s:=Sprite2D.new()
    s.texture=game.Actor.magic_texture(row,0)
    s.texture_filter=CanvasItem.TEXTURE_FILTER_NEAREST
    s.position=at;s.offset=Vector2(64,64)-game.Actor.magic_anchor(row)
    s.scale=Vector2.ONE*(width/128.0);s.z_index=11
    add_child(s)
    vfx.append({"sprite":s,"row":row,"time":0.0,"duration":duration})

func strike(m: Dictionary) -> void:
    var id: String=m.id
    if id=="cleave":
        if m.spawned==0:
            m.spawned=1
            _effect(0,Vector2(game.boss.x+m.direction*80,game.FLOOR-game.boss.y-60),130.0+m.combo*20,0.25)
        var reach: float=([135.0,155.0,185.0] if m.phase==1 else [175.0,200.0,225.0])[m.combo]
        var origin: float=game.boss.x
        if not m.hit and (game.enemy.x-origin)*m.direction>-24 and absf(game.enemy.x-origin)<reach and absf(game.enemy.y-game.boss.y)<125:
            var before: float=game.enemy.hp
            game._hit_enemy(m.spec.damage,id)
            m.hit=true
            if game.enemy.hp<before:
                var knock: float=(120.0 if m.combo==0 else -90.0 if m.combo==1 else 350.0)*m.direction
                game.enemy.knock=knock if game.enemy.state=="hurt" else knock*0.18
                if m.combo==1 and game.enemy.state=="hurt":game.enemy.vy=maxf(game.enemy.vy,210.0)
        if not m.get("echo_recorded",false):
            m.echo_recorded=true
            if not echo_arm.is_empty():
                var actor: String="ascended" if m.phase==2 else "king"
                var pos: Vector2=echo_arm.position
                var s: Sprite2D=_sprite(actor,"royal_hand_"+str(m.combo),0,pos,0.38)
                s.flip_h=m.direction>0
                echoes.append({"x":pos.x,"y":pos.y,"direction":m.direction,"combo":m.combo,"phase":m.phase,"damage":m.spec.damage*0.65,"reach":reach,"t":-0.65,"hit":false,"sprite":s})
                echo_arm.clear()
                if is_instance_valid(arm_sprite):arm_sprite.queue_free()
                arm_sprite=null
    elif id=="throw" and m.spawned==0:
        m.spawned=1
        var old: Vector2=Vector2(game.boss.x,game.boss.y)
        _effect(1,Vector2(old.x,game.FLOOR-old.y),140,0.45)
        if m.phase==1:
            echo_arm={"position":old,"ttl":3.0}
            if is_instance_valid(arm_sprite):arm_sprite.queue_free()
            arm_sprite=_sprite("king","royal_echo",7,old,0.23)
        else:
            var s: Sprite2D=_sprite("ascended","royal_hand_0",0,old,0.30)
            s.flip_h=m.direction>0
            echoes.append({"x":old.x,"y":old.y,"direction":m.direction,"combo":0,"phase":2,"damage":game.Rules.CROWN_MOVES.cleave.damage*0.65,"reach":200.0,"t":-0.65,"hit":false,"sprite":s})
            game.boss.x=clampf(game.boss.x+m.direction*200.0,48.0,912.0)
            game.boss.vx=m.direction*80.0
            game._trail(game.king,Color("#8cf4ff"))
        game.audio.sfx("cloth")
    elif id=="reap" and m.spawned==0:
        m.spawned=1
        if field.has("sprite") and is_instance_valid(field.sprite):field.sprite.queue_free()
        var s:=Sprite2D.new()
        s.texture=game.Actor.magic_texture(3 if m.phase==2 else 2,1)
        s.texture_filter=CanvasItem.TEXTURE_FILTER_NEAREST
        s.position=Vector2(m.target,game.FLOOR)
        s.offset=Vector2(64,64)-game.Actor.magic_anchor(3 if m.phase==2 else 2)
        s.scale=Vector2(1.875,1.0)
        s.modulate=Color(0.72,0.56,1.0,0.55) if m.phase==2 else Color(1.0,0.70,0.30,0.55)
        s.z_index=3;add_child(s)
        field={"x":m.target,"radius":120.0,"ttl":1.6,"phase":m.phase,"sprite":s,"hit":false}
    elif id=="nova":
        if m.phase==2:
            var dx: float=game.boss.x-game.enemy.x
            if absf(dx)<350 and not m.hit:
                game.enemy.x=clampf(game.enemy.x+signf(dx)*minf(absf(dx),650.0*float(m.get("step",1.0/60.0))),30.0,930.0)
            if m.t<0.36:return
        if not m.hit:
            m.hit=true
            strain=2.4;game.boss.guarding=false
            var radius: float=350.0 if m.phase==2 else 260.0
            if absf(game.enemy.x-game.boss.x)<(180.0 if m.phase==2 else radius) and absf(game.enemy.y-game.boss.y)<180:
                game._hit_enemy(28.0+float(m.get("paid",40.0))*0.60,"nova")
                game.enemy.knock=signf(game.enemy.x-game.boss.x)*(520.0 if m.phase==1 else -300.0)
            _effect(5 if m.phase==2 else 4,Vector2(game.boss.x,game.FLOOR-game.boss.y-65),radius*1.6,0.50)
            for p in game.projectiles.duplicate():
                if not p.friendly and absf(p.p.x-game.boss.x)<radius:
                    if is_instance_valid(p.sprite):p.sprite.queue_free()
                    game.projectiles.erase(p);interactions.redirects+=1
            interactions.redirects+=game.powers.disperse(float(game.boss.x),radius)
            interactions.bursts+=1
            game.audio.pulse("climax");game.trauma=maxf(game.trauma,7.0)

func tick(dt: float) -> void:
    for item in vfx.duplicate():
        item.time+=dt
        item.sprite.texture=game.Actor.magic_texture(item.row,clampi(int(item.time/item.duration*6),0,5))
        if item.time>=item.duration:item.sprite.queue_free();vfx.erase(item)
    dry=maxf(0,dry-dt)
    strain=maxf(0,strain-dt);_regen_delay=maxf(0,_regen_delay-dt)
    if _regen_delay<=0 and strain<=0 and game.move.is_empty() and not game.boss.guarding:gain(3.0*dt)
    if not echo_arm.is_empty():
        echo_arm.ttl-=dt
        if echo_arm.ttl<=0:
            echo_arm.clear()
            if is_instance_valid(arm_sprite):arm_sprite.queue_free()
            arm_sprite=null
    for e in echoes.duplicate():
        e.t+=dt
        var frame: int=clampi(int((e.t+0.65)/0.65*5),0,4) if e.t<0 else clampi(5+int(e.t*16),5,11)
        e.sprite.texture=game.Actor.texture_for("ascended" if e.phase==2 else "king","royal_hand_"+str(e.combo),frame)
        e.sprite.modulate.a=0.24 if e.t<0 else maxf(0,0.70-e.t)
        if e.t>=0 and not e.hit:
            e.hit=true
            if absf(game.enemy.x-e.x)<e.reach and (game.enemy.x-e.x)*e.direction>-24 and absf(game.enemy.y-e.y)<125:
                var before: float=game.enemy.hp
                game._hit_enemy(e.damage,"echo",e.x)
                if game.enemy.hp<before:interactions.echo_hits+=1
        if e.t>0.55:
            e.sprite.queue_free();echoes.erase(e)
    if not field.is_empty():_field_tick(dt)

func _field_tick(dt: float) -> void:
    field.ttl-=dt
    var dx: float=field.x-game.enemy.x
    var inside: bool=absf(dx)<field.radius
    if inside:
        var mass: float=0.35 if game.life==5 else 0.8 if game.life==2 else 1.0
        game.enemy.x=clampf(game.enemy.x+signf(dx)*(1 if field.phase==1 else -1)*minf(absf(dx),130.0*dt*mass),30,930)
        if field.phase==1:
            if game.enemy.y>0:interactions.groundings+=1
            game.enemy.y=move_toward(float(game.enemy.y),0,440.0*dt)
            game.enemy.vy=minf(float(game.enemy.vy),0)
        elif game.enemy.y<100:
            game.enemy.y=move_toward(float(game.enemy.y),100,190.0*dt)
            game.enemy.vy=maxf(float(game.enemy.vy),0)
        if not field.hit:
            field.hit=true;game._hit_enemy(10.0,"reap",field.x)
    var bends: int=game.powers.bend_field(float(field.x),float(field.radius),int(field.phase),dt)
    interactions.redirects+=bends
    field.sprite.texture=game.Actor.magic_texture(3 if field.phase==2 else 2,clampi(1+int((1.6-field.ttl)*3),1,5))
    field.sprite.modulate.a=minf(0.55,field.ttl*2)
    if field.ttl<=0:
        field.sprite.queue_free();field.clear()

func debug_state() -> Dictionary:
    var f: Dictionary={}
    if not field.is_empty():f={"x":field.x,"radius":field.radius,"ttl":field.ttl,"phase":field.phase}
    return {"pressure":pressure,"max_pressure":100,"strain":strain,"pressure_blocked":dry>0,"echo_armed":not echo_arm.is_empty(),"echoes":echoes.size(),"field":f,"interactions":interactions.duplicate()}
