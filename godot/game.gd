# AI-use disclosure: Codex-authored native Godot gameplay port and revised royal sprite staging.
extends Node2D
const Rules = preload("res://combat_rules.gd")
const Actor = preload("res://actor_view.gd")
const FLOOR = 464.0
var ui
var audio
var king
var visitor
var backdrop: Sprite2D
var ruins: Sprite2D
var finisher: Sprite2D
var ward: Sprite2D
var enemy_ward: Sprite2D
var message: Label
var mode = "menu"
var stage = ""
var life = 0
var fight_index = 0
var planner
var history:Array=[]
var move_counts:Dictionary={}
var current_plan:Dictionary={}
var phase_counts:Dictionary={}
var first_moves:Array=[]
var sequence:Array=[]
var nova_hp:Array=[]
var phase_started=-1.0
var distance_sum=0.0
var distance_samples=0
var shift_count=0
var last_direction=0
var minimum_hp=1.0
var damage_dealt=0.0
var phase = 1
var epoch = 0
var bond = 0
var elapsed = 0.0
var mode_t = 0.0
var hitstop = 0.0
var publish_t = 0.0
var trail_t = 0.0
var foot_t = 0.0
var choice_step = 0
var ending = ""
var ending_ready = false
var combat_clock = 0.0
var boss: Dictionary = {}
var enemy: Dictionary = {}
var move: Dictionary = {}
var effects: Array = []
var projectiles: Array = []
var content: Dictionary = {}
var params: Dictionary = {}
var speed = 1.0
var autoplay = false
var debug_mode = false
var input_edges: Dictionary = {}
var completed: Array = []

func _ready() -> void:
    if OS.has_feature("web"):
        var search = str(JavaScriptBridge.eval("window.location.search"))
        for piece in search.trim_prefix("?").split("&"):
            var pair = piece.split("=",true,1)
            if pair.size()>0:
                params[pair[0]]=pair[1] if pair.size()>1 else "1"
    autoplay=params.get("autoplay","0")=="1"
    debug_mode=params.get("debug","0")=="1"
    speed=clampf(float(params.get("speed","1")),1.0,8.0)
    backdrop=_background("res://art/arena-night.png",0)
    ruins=_background("res://art/arena-ruins.png",1)
    ruins.modulate.a=0.0
    king=Actor.new()
    add_child(king)
    king.setup("king")
    king.z_index=8
    visitor=Actor.new()
    add_child(visitor)
    visitor.setup("kitten")
    visitor.z_index=7
    ward=Sprite2D.new()
    enemy_ward=Sprite2D.new()
    add_child(ward)
    add_child(enemy_ward)
    ward.z_index=13
    enemy_ward.z_index=13
    finisher=Sprite2D.new()
    add_child(finisher)
    finisher.z_index=12
    finisher.texture_filter=CanvasItem.TEXTURE_FILTER_NEAREST
    message=Label.new()
    message.horizontal_alignment=HORIZONTAL_ALIGNMENT_CENTER
    message.position=Vector2(80,90)
    message.size=Vector2(800,80)
    message.add_theme_font_size_override("font_size",24)
    message.z_index=30
    add_child(message)
    audio=load("res://court_audio.gd").new()
    add_child(audio)
    planner=load("res://run_planner.gd").new()
    add_child(planner)
    ui=load("res://court_ui.gd").new()
    ui.audio=audio
    add_child(ui)
    ui.play_requested.connect(_start)
    ui.menu_requested.connect(_menu)
    var decoded=JSON.parse_string(FileAccess.get_file_as_string("res://content/visitors.json"))
    if decoded is Dictionary: content=decoded.get("visitors",{})
    _reset_bodies()
    _menu()
    if autoplay:
        await _pause(0.65)
        _start()

func _background(path: String, depth: int) -> Sprite2D:
    var s=Sprite2D.new()
    s.texture=load(path)
    s.position=Vector2(480,270)
    if s.texture: s.scale=Vector2(960.0/s.texture.get_width(),540.0/s.texture.get_height())
    s.texture_filter=CanvasItem.TEXTURE_FILTER_NEAREST
    s.z_index=depth
    add_child(s)
    return s

func _menu() -> void:
    epoch+=1
    mode="menu"
    stage=""
    ending_ready=false
    finisher.visible=false
    king.visible=false
    visitor.visible=false
    ward.visible=false
    enemy_ward.visible=false
    message.text=""
    _clear_effects()
    ui.reset()
    ui.hide_hud()
    ui.show_menu("res://art/menu.png")
    audio.music("menu")

func _start() -> void:
    epoch+=1
    life=0
    fight_index=0
    history.clear()
    current_plan.clear()
    planner.calls=0
    bond=0
    completed.clear()
    ending=""
    ui.reset()
    ui.hide_menu()
    ui.hide_hud()
    ruins.modulate.a=0.0
    _set_background("arena-night")
    if autoplay: _encounter()
    else: _opening()

func _set_background(id: String) -> void:
    backdrop.texture=load("res://art/"+id+".png")
    backdrop.scale=Vector2(960.0/backdrop.texture.get_width(),540.0/backdrop.texture.get_height())

func _reset_bodies() -> void:
    boss={"x":800.0,"y":0.0,"vy":0.0,"vx":0.0,"knock":0.0,"hp":700.0,"max":700.0,
        "facing":-1,"grounded":true,"dash":0.0,"dash_cd":0.0,"invuln":0.0,"guard":1.0,
        "guarding":false,"flash":0.0,"inactive":0.0,"jumps":0,"dashes":0,"blocks":0,
        "combo":0,"combo_until":-1.0,"combo_queue":0,"combo_buffer":0.0,"combo_history":[],
        "stride":0.0,"steps":0,"land":0.0,"coyote":0.1,"jump_buffer":0.0,"input_buffer":0.0,"buffered_action":"","transition":0.0,"phase_triggered":false,
        "cooldowns":{"cleave":0.0,"throw":0.0,"reap":0.0,"nova":0.0}}
    var stats=Rules.stats(fight_index)
    move_counts={"cleave":0,"throw":0,"reap":0,"nova":0}
    phase_counts={"1":move_counts.duplicate(),"2":move_counts.duplicate()}
    first_moves.clear()
    sequence.clear()
    nova_hp.clear()
    phase_started=-1.0
    distance_sum=0.0
    distance_samples=0
    shift_count=0
    last_direction=0
    minimum_hp=1.0
    damage_dealt=0.0
    enemy={"x":-40.0,"y":0.0,"vy":0.0,"knock":0.0,"hp":stats.hp,"max":stats.hp,
        "damage":stats.damage,"speed":stats.speed,"state":"enter","t":0.0,"decision":0.1,
        "windup":0.0,"ability_cd":2.5,"ability_t":0.0,"ability_serial":0,"attack_flash":0.0,
        "flash":0.0,"invuln":0.0,"poise":0.0,"evade_cd":0.0,"guard_t":0.0,
        "kneel":0.0,"armored":life==5,"mobility_cd":0.8,"dash_dir":1.0,"chain_left":1,"combo_index":0,
        "dashes":0,"strikes":0,"abilities":0,"stride":0.0,"steps":0}
    move.clear()
    phase=1
    combat_clock=0.0
    input_edges.clear()
    _clear_effects()

func _opening() -> void:
    var token=epoch
    mode="opening"
    stage="arrival"
    audio.music("years")
    king.who="king"
    king.visible=true
    visitor.visible=true
    king.rotation=0.0
    king.position=Vector2(880,422)
    visitor.setup("alley")
    visitor.position=Vector2(90,FLOOR)
    king.pose("rest",2,-1,143)
    create_tween().tween_property(visitor,"position:x",490.0,1.2)
    await _pause(1.25)
    if token!=epoch:return
    stage="challenge"
    await ui.speak("YOU","I came for the crown.","alley",1.9)
    if token!=epoch:return
    for n in range(6):
        king.pose("rise",n,-1,143)
        await _pause(0.07)
        if token!=epoch:return
    create_tween().tween_property(king,"position",Vector2(740,FLOOR),0.32)
    await _pause(0.34)
    if token!=epoch:return
    king.visible=false
    visitor.visible=false
    finisher.visible=true
    finisher.position=Vector2(640,FLOOR)
    finisher.offset=Vector2(0,-112)
    finisher.scale=Vector2.ONE
    for n in range(6):
        stage="crossed-steel" if n<3 else "blast-back"
        finisher.texture=Actor.opening_duel_texture(n)
        if n in [1,2]:
            audio.sfx("sword-hit")
            _fx(0,Vector2(640,FLOOR-65),125,0.20,"royal")
        elif n==3:
            audio.sfx("magic")
            _fx(2,Vector2(670,FLOOR-60),235,0.38,"royal")
        elif n==5:audio.sfx("step")
        await _pause(0.14 if n<3 else 0.18)
        if token!=epoch:return
    for n in range(6,12):
        stage="counter-thrust" if n<8 else "old-king-pierced"
        finisher.texture=Actor.opening_duel_texture(n)
        if n==6:audio.sfx("dash")
        elif n==8:audio.sfx("stab")
        if n in [8,9,10]:_blood(Vector2(690,FLOOR-75))
        await _pause(0.14 if n<8 else 0.22)
        if token!=epoch:return
    stage="fallen"
    await ui.speak("THE CROWNED ONE","Ha. You think you have won.","king",2.0)
    if token!=epoch:return
    await ui.speak("THE CROWNED ONE","You will outlive every voice that calls you king.","king",2.4)
    if token!=epoch:return
    await ui.speak("YOU","It does not matter.","alley",1.9)
    if token!=epoch:return
    stage="crown-held"
    _fx(4,Vector2(690,FLOOR-60),270,0.7,"nova")
    audio.sfx("magic")
    finisher.position=Vector2(700,FLOOR)
    finisher.offset=Vector2(0,-58)
    for n in range(12):
        finisher.texture=Actor.coronation_texture(n)
        if n==7:
            stage="crown-burst"
            audio.sfx("nova")
            _fx(4,Vector2(700,FLOOR-70),400,0.95,"nova")
        await _pause(0.13 if n<7 else 0.16)
        if token!=epoch:return
    finisher.visible=false
    stage="centuries"
    message.text="A thousand years."
    king.visible=true
    king.who="king"
    king.rotation=0.0
    king.modulate=Color.WHITE
    king.position=Vector2(880,422)
    king.pose("rest",2,-1,143)
    await _pause(2.0)
    if token!=epoch:return
    message.text=""
    _encounter()

func _encounter() -> void:
    var token=epoch
    _reset_bodies()
    _set_background("arena-night" if life<3 else "arena-mid" if life<6 else "arena-late")
    ruins.modulate.a=0.0
    mode="arrival"
    stage="walk-in"
    mode_t=0.0
    choice_step=0
    king.visible=true
    visitor.visible=true
    king.modulate=Color.WHITE
    visitor.modulate=Color.WHITE
    king.rotation=0.0
    visitor.rotation=0.0
    visitor.setup(Rules.LIVES[life])
    audio.music("years")
    await _pause(0.35 if autoplay else 1.7)
    if token!=epoch:return
    while enemy.state=="enter":
        await get_tree().process_frame
        if token!=epoch:return
    stage="conversation"
    var history:Array=[]
    var script_data:Dictionary=content.get(Rules.LIVES[life],{})
    for step in range(2):
        choice_step=step+1
        var branch:Dictionary
        if step==0: branch=script_data.get("first",{})
        else: branch=script_data.get("second",[{},{}])[0 if history[0] else 1]
        var options:Array=branch.get("choices",["I remember.","Raise your weapon."])
        if not autoplay:
            await ui.speak("???",branch.get("question","You are still here."),Rules.LIVES[life],2.1)
            if token!=epoch:return
        var open=true
        if not autoplay:
            open=await ui.choose(options)
            if token!=epoch:return
        history.append(open)
        bond=clampi(bond+(1 if open else -1),0,8)
        if not autoplay:
            await ui.speak("THE IMMORTAL",str(options[0 if open else 1]),"king",1.8)
            if token!=epoch:return
            var response=str(branch.get("responses",["Then look at me.","Then fight."])[0 if open else 1])
            if bond>=4:response+=" "+str(script_data.get("remembered",""))
            await ui.speak("?? / ??",response,Rules.LIVES[life],2.0)
            if token!=epoch:return
    if life==0 and not autoplay:
        await ui.speak("?? / ??","Show me a jump, a dash, and a guarded hit.","kitten",2.0)
        if token!=epoch:return
    mode="fight"
    stage=""
    combat_clock=0.0
    choice_step=0
    input_edges.clear()
    audio.music(Rules.LIVES[life])

func _pause(seconds:float) -> void:
    await get_tree().create_timer(seconds).timeout

func _unhandled_input(event:InputEvent) -> void:
    if not event is InputEventKey or not event.pressed or event.echo:return
    if event.keycode==KEY_M:audio.toggle_mute()
    if ending_ready and event.keycode==KEY_ENTER:
        _menu()
        return
    if mode=="fight" and event.keycode==KEY_ESCAPE:
        mode="paused"
        message.text="PAUSED\nEnter resumes · T returns to the castle"
        return
    if mode=="paused":
        if event.keycode in [KEY_ENTER,KEY_ESCAPE]:mode="fight";message.text=""
        elif event.keycode==KEY_T:_menu()
        return
    if debug_mode and mode in ["arrival","fight","waiting"]:
        if event.keycode>=KEY_1 and event.keycode<=KEY_9:
            epoch+=1
            ui.reset()
            life=event.keycode-KEY_1
            fight_index=life
            _encounter()
            return
        if event.keycode==KEY_P:_begin_crown_stance()
    if mode=="fight":
        for action in ["jump","dash","cleave","throw","reap","nova"]:
            if event.is_action_pressed(action):
                input_edges[action]=true
                if action=="cleave":input_edges["cleave_taps"]=int(input_edges.get("cleave_taps",0))+1

func _physics_process(dt:float) -> void:
    elapsed+=dt
    mode_t+=dt
    _update_effects(dt)
    if mode=="arrival":
        if enemy.state=="enter":
            enemy.x=move_toward(float(enemy.x),90.0,145.0*dt*speed)
            if enemy.x>=90:enemy.state="wait"
        _animate()
    elif mode=="fight":
        if hitstop>0:hitstop-=dt
        else:
            for n in range(int(speed) if autoplay else 1):
                if mode!="fight":break
                _combat_step(1.0/60.0)
        if mode=="fight":
            _animate()
            _hud()
    elif mode=="waiting":
        king.position.x=move_toward(king.position.x,880.0,220.0*dt)
        var climb=clampf((king.position.x-760.0)/120.0,0.0,1.0)
        king.position.y=lerpf(FLOOR,422.0,climb)
        var seated=absf(king.position.x-880.0)<2.0
        king.pose("rest" if seated else "run",int(elapsed*(1.3 if seated else 10.0))%6,-1 if seated else 1,143)
    elif mode=="opening" and stage=="arrival":
        visitor.pose("run",int(elapsed*10)%6,1,90)
    publish_t+=dt
    if publish_t>=0.1:
        publish_t=0.0
        _publish_state()

func _read_input() -> Dictionary:
    var result:Dictionary={}
    for action in ["left","right","guard","hold"]:result[action]=Input.is_action_pressed(action)
    for action in ["jump","dash","cleave","throw","reap","nova"]:result[action]=input_edges.get(action,false)
    result.cleave_taps=int(input_edges.get("cleave_taps",0))
    result.jump_held=Input.is_action_pressed("jump")
    if not result["throw"] and not result.reap and not result.nova:
        result.cleave=result.cleave or Input.is_action_pressed("cleave")
    input_edges.clear()
    return _bot_input() if autoplay else result

func _bot_input() -> Dictionary:
    var i={"left":false,"right":false,"jump":false,"dash":false,"guard":false,"hold":false,"cleave":false,"throw":false,"reap":false,"nova":false}
    var policy=str(params.get("bot","victory"))
    if policy=="idle":return i
    var distance=absf(boss.x-enemy.x)
    if life==0 and not _tutorial_complete():
        if boss.jumps==0:i.jump=true
        elif not boss.grounded:pass
        elif boss.dashes==0:i.dash=true;i.left=enemy.x<boss.x;i.right=enemy.x>boss.x
        elif boss.blocks==0:
            i.left=distance>85 and enemy.x<boss.x
            i.right=distance>85 and enemy.x>boss.x
            i.guard=enemy.state=="attack"
        return i
    if policy=="normal" and life>0:i.guard=true;return i
    var reach=Rules.MELEE[life].reach+75
    i.guard=enemy.state=="attack" and distance<reach and boss.guard>0.2
    i.left=(distance>180 and enemy.x<boss.x) or (distance<140 and enemy.x>boss.x)
    i.right=(distance>180 and enemy.x>boss.x) or (distance<140 and enemy.x<boss.x)
    if enemy.state=="attack" and enemy.windup>Rules.MELEE[life].tell-0.1 and distance<reach and boss.dash_cd<=0:
        i.dash=true;i.guard=false
    for p in projectiles:
        if not p.friendly and absf(p.p.x-boss.x)<170:
            if p.low and boss.grounded:i.jump=true
            elif boss.dash_cd<=0:i.dash=true
    if i.guard or i.dash or not move.is_empty():return i
    if boss.cooldowns.nova<=0:i.nova=true
    elif distance<(300 if phase==2 else 195) and boss.cooldowns.cleave<=0:i.cleave=true
    elif boss.cooldowns.reap<=0:i.reap=true
    elif boss.cooldowns["throw"]<=0:i["throw"]=true
    return i

func _combat_step(dt:float) -> void:
    combat_clock+=dt
    distance_sum+=absf(boss.x-enemy.x)
    distance_samples+=1
    minimum_hp=minf(minimum_hp,(boss.hp/700.0)*(0.5 if phase==2 else 1.0))
    var i=_read_input()
    boss.invuln=maxf(0,boss.invuln-dt)
    boss.flash=maxf(0,boss.flash-dt)
    boss.dash_cd=maxf(0,boss.dash_cd-dt)
    for key in boss.cooldowns:boss.cooldowns[key]=maxf(0,boss.cooldowns[key]-dt)
    var activity=false
    for value in i.values():
        if value:activity=true
    boss.inactive=0.0 if activity else boss.inactive+dt
    if boss.inactive>=55:_finish("do_nothing");return
    if boss.transition>0:
        boss.transition-=dt
        if boss.transition<=0:phase=2;boss.hp=525.0
    else:_player_step(i,dt)
    _move_step(dt)
    _projectile_step(dt)
    _enemy_step(dt)
    if boss.hp<=0:_finish("normal")
    elif enemy.hp<=0:_win_encounter()

func _player_step(i:Dictionary,dt:float) -> void:
    var direction=(-1 if i.left else 0)+(1 if i.right else 0)
    var was_grounded:bool=boss.grounded
    if direction!=0 and direction!=last_direction:
        shift_count+=1
        last_direction=direction
    if direction!=0 and move.is_empty():boss.facing=direction
    boss.coyote=0.10 if boss.grounded else maxf(0,boss.coyote-dt)
    boss.jump_buffer=0.13 if i.jump else maxf(0,boss.jump_buffer-dt)
    boss.input_buffer=maxf(0,boss.input_buffer-dt)
    boss.combo_buffer=maxf(0,boss.combo_buffer-dt)
    if boss.combo_buffer<=0:boss.combo_queue=0
    var taps:int=int(i.get("cleave_taps",0))
    if taps>0:
        boss.combo_queue=mini(2,int(boss.combo_queue)+taps)
        boss.combo_buffer=0.70
    # Short buffers preserve deliberate inputs made during another move's recovery.
    for id in ["nova","reap","throw"]:
        if i[id]:
            boss.buffered_action=id
            boss.input_buffer=0.20
            break
    if boss.jump_buffer>0 and boss.coyote>0 and boss.dash<=0:
        boss.vy=580.0;boss.grounded=false;boss.jumps+=1
        boss.jump_buffer=0.0;boss.coyote=0.0
        audio.sfx("jump")
    if not bool(i.get("jump_held",true)) and boss.vy>230:
        boss.vy=move_toward(float(boss.vy),230.0,2600.0*dt)
    if i.dash and boss.dash_cd<=0:
        if direction!=0:boss.facing=direction
        boss.dash=0.17;boss.dash_cd=0.56;boss.invuln=maxf(boss.invuln,0.17);boss.dashes+=1
        boss.combo_queue=0
        move.clear()
        audio.sfx("dash")
        _trail(king,Color("#6fe7ff") if phase==2 else Color("#ffc976"))
        _fx(4,king.position+Vector2(0,-55),190,0.25,"royal",boss.facing)
    boss.guarding=i.guard and boss.guard>0.08 and move.is_empty() and boss.dash<=0
    boss.guard=clampf(boss.guard+(-0.42 if boss.guarding else 0.3)*dt,0,1)
    if boss.dash>0:
        boss.dash=maxf(0,boss.dash-dt)
        boss.vx=boss.facing*lerpf(720.0,1000.0,boss.dash/0.17)
    else:
        var target:float=direction*310.0*(1.15 if phase==2 else 1.0)*(0.46 if boss.guarding else 1.0)
        var acceleration:float=3200.0 if boss.grounded else 1900.0
        if direction==0:acceleration=2800.0 if boss.grounded else 900.0
        boss.vx=move_toward(float(boss.vx),target,acceleration*dt)
    var before:float=boss.x
    boss.x=clampf(boss.x+(boss.vx+boss.knock)*dt,48,912)
    boss.knock=move_toward(float(boss.knock),0,maxf(1,absf(boss.knock))*10*dt)
    if not boss.grounded:
        boss.vy-=(1900.0 if boss.vy<0 else 1650.0)*dt
        boss.y+=boss.vy*dt
        if boss.y<=0:boss.y=0.0;boss.vy=0.0;boss.grounded=true
    # Steps follow distance travelled on the floor; airborne movement never ticks.
    if boss.grounded and boss.dash<=0:
        var old_step:int=int(boss.stride/44.0)
        boss.stride+=absf(boss.x-before)
        if int(boss.stride/44.0)>old_step:audio.sfx("step");boss.steps+=1
    if not was_grounded and boss.grounded:
        audio.sfx("step")
        boss.land=0.09
    boss.land=maxf(0,boss.land-dt)
    if not boss.guarding and boss.dash<=0:
        if not move.is_empty() and move.id=="cleave" and move.stage=="recover" and move.t>=0.035:
            if boss.combo_queue>0 or i.cleave:
                move.clear()
                _start_move("cleave")
                boss.combo_queue=maxi(0,int(boss.combo_queue)-1)
                return
        if move.is_empty():
            if boss.input_buffer>0 and boss.cooldowns[boss.buffered_action]<=0:
                var action:String=boss.buffered_action
                boss.input_buffer=0.0
                _start_move(action)
            elif (boss.combo_queue>0 or i.cleave) and boss.cooldowns.cleave<=0:
                _start_move("cleave")
                boss.combo_queue=maxi(0,int(boss.combo_queue)-1)

func _start_move(id:String) -> void:
    var spec=Rules.move_spec(id,phase)
    move_counts[id]=int(move_counts.get(id,0))+1
    phase_counts[str(phase)][id]+=1
    sequence.append(id)
    if first_moves.size()<8:first_moves.append(id)
    if id=="nova":nova_hp.append(boss.hp/700.0)
    # Keep movement-facing control, but turn toward a nearby target for a committed strike.
    if absf(enemy.x-boss.x)<400:boss.facing=-1 if enemy.x<boss.x else 1
    if id=="cleave":
        boss.combo=(boss.combo+1)%3 if combat_clock<=boss.combo_until else 0
        boss.combo_until=combat_clock+0.88
        if boss.combo==1:spec.tell*=0.80;spec.active*=0.90
        elif boss.combo==2:spec.tell*=1.30;spec.damage*=1.25;spec.recover*=1.25
        boss.combo_history.append(boss.combo)
    boss.cooldowns[id]=spec.cooldown
    move={"id":id,"phase":phase,"spec":spec,"stage":"tell","t":0.0,"direction":boss.facing,"target":enemy.x,"combo":boss.combo,"spawned":0,"hit":false,"marks":[]}
    if id=="reap" and phase==2:move.marks=[boss.x-180,boss.x,boss.x+180]
    if id=="nova" and phase==1:move.marks=[boss.x+boss.facing*90,boss.x+boss.facing*250,boss.x+boss.facing*410]
    audio.sfx("magic" if phase==2 or id in ["nova","reap"] else "sword-draw")
    if life>0 and enemy.evade_cd<=0:
        if life in [1,8] and id=="cleave" and boss.combo==0:
            enemy.state="evade";enemy.t=0.16;enemy.invuln=0.10;enemy.evade_cd=2.0
            enemy.knock=signf(enemy.x-boss.x)*330
            _trail(visitor,Rules.COLORS[life])
        elif life==2 and id=="throw":enemy.guard_t=0.45;enemy.evade_cd=1.5
        elif life==3 and id=="reap":enemy.vy=610.0;enemy.y=maxf(1,enemy.y);enemy.evade_cd=1.5
        elif life==4 and id=="nova":
            _enemy_dash(-signf(boss.x-enemy.x))
            enemy.invuln=0.22;enemy.evade_cd=2.5
        elif life==6 and id in ["throw","nova"]:
            _enemy_dash(signf(boss.x-enemy.x))
            enemy.invuln=0.18;enemy.evade_cd=2.0

func _move_step(dt:float) -> void:
    if move.is_empty():return
    move.t+=dt
    var spec:Dictionary=move.spec
    if move.stage=="tell" and move.t>=spec.tell:
        move.stage="active";move.t=0.0
        if move.id=="throw" and phase==1:boss.vx=move.direction*650.0
        elif move.id=="cleave":boss.vx=move.direction*(380.0 if move.combo<2 else 530.0)
        if move.id not in ["nova","reap"] or phase==1 and move.id=="reap":
            var effect=_royal_fx(move.id,Vector2(move.target if move.id=="reap" else boss.x+move.direction*75,FLOOR-boss.y-65),phase)
            if move.id=="cleave":
                effect.flip_v=move.combo==1
                effect.rotation=deg_to_rad((-30 if move.combo==1 else 36 if move.combo==2 else 0)*move.direction)
                effects[-1].velocity=Vector2(move.direction*(160 if move.combo<2 else 250),-80 if move.combo==1 else 70 if move.combo==2 else 0)
            audio.sfx("sword" if phase==1 else "magic")
    if move.stage=="active":
        _active_hit()
        if move.t>=spec.active:move.stage="recover";move.t=0.0
    elif move.stage=="recover" and move.t>=spec.recover:move.clear()

func _active_hit() -> void:
    var id:String=move.id
    var damage:float=move.spec.damage
    if id=="cleave":
        var ranges=[166.0,185.0,218.0] if phase==1 else [212.0,248.0,290.0]
        if not move.hit and (enemy.x-boss.x)*move.direction>-24 and absf(enemy.x-boss.x)<ranges[move.combo] and absf(enemy.y-boss.y)<(150 if move.combo==1 else 120):
            _hit_enemy(damage,id)
            if move.combo==1:enemy.vy=maxf(enemy.vy,320.0)
            elif move.combo==2:enemy.knock=move.direction*540.0
            move.hit=true
        if phase==2 and move.spawned==0:
            move.spawned=1
            _fx(2,Vector2(boss.x,FLOOR-boss.y-50),220+move.combo*50,0.36,"royal")
    elif id=="throw":
        if phase==1:
            if not move.hit and (enemy.x-boss.x)*move.direction>-20 and absf(enemy.x-boss.x)<230 and absf(enemy.y-boss.y)<72:
                move.hit=true
                if enemy.guard_t<=0:_hit_enemy(damage,id)
                else:audio.sfx("guard")
        else:
            # Crown fragments fall as separate physical blades rather than a base-form thrust.
            while move.spawned<5 and move.t>=move.spawned*0.075:
                var lane:float=move.target+(move.spawned-2)*60
                _projectile(Vector2(lane-move.direction*70,290),Vector2(move.direction*130,-520),15,false,damage,true,life)
                move.spawned+=1
    elif id=="reap":
        if phase==1:
            if move.spawned==0:
                move.spawned=1
                if absf(enemy.x-move.target)<88 and enemy.y<72:
                    var before:float=enemy.hp
                    _hit_enemy(damage,id)
                    if enemy.hp<before:
                        enemy.y=0.0;enemy.vy=0.0;enemy.knock=0.0;enemy.kneel=0.42
        else:
            while move.spawned<3 and move.t>=move.spawned*0.16:
                var x:float=move.marks[move.spawned]
                move.spawned+=1
                _royal_fx("reap",Vector2(x,FLOOR-65),2)
            if not move.hit and absf(enemy.x-boss.x)<310 and enemy.y<164:
                _hit_enemy(damage,id)
                enemy.knock=signf(boss.x-enemy.x)*500
                enemy.vy=260.0
                move.hit=true
    elif phase==1:
        while move.spawned<3 and move.t>=move.spawned*0.14:
            var x:float=move.marks[move.spawned]
            move.spawned+=1
            _royal_fx("cleave",Vector2(x,FLOOR-65),1)
            if absf(enemy.x-x)<104 and enemy.y<130:_hit_enemy(damage,id)
    else:
        var radius:float=520*minf(1,move.t/move.spec.active)
        if move.spawned<int(move.t*20)+1:
            move.spawned+=1
            _fx(4,Vector2(boss.x-radius,FLOOR-55),180,0.30,"nova",-1)
            _fx(4,Vector2(boss.x+radius,FLOOR-55),180,0.30,"nova",1)
        if not move.hit and absf(absf(enemy.x-boss.x)-radius)<64 and enemy.y<130:
            _hit_enemy(damage,id);move.hit=true

func _hit_enemy(damage:float,id:String) -> void:
    if enemy.hp<=0 or enemy.invuln>0:return
    if enemy.armored:
        enemy.armored=false
        audio.sfx("metal")
        _fx(3,visitor.position+Vector2(0,-40),110,0.26,"royal")
        return
    var before_hp:float=enemy.hp
    enemy.hp-=damage
    if life==0 and not _tutorial_complete():enemy.hp=maxf(1,enemy.hp)
    damage_dealt+=maxf(0,before_hp-maxf(0,enemy.hp))
    enemy.flash=0.14
    var resisted:bool=id=="cleave" and enemy.poise>0
    enemy.knock=signf(enemy.x-boss.x)*(60 if resisted else 420 if id=="nova" else 260)
    if not resisted:
        enemy.state="hurt";enemy.t=0.20;enemy.windup=0.0
        if id in ["cleave","nova"]:enemy.vy=maxf(enemy.vy,180.0)
    _blood(Vector2(enemy.x,FLOOR-enemy.y-38))
    hitstop=0.035
    audio.sfx("hit")

func _enemy_step(dt:float) -> void:
    enemy.invuln=maxf(0,enemy.invuln-dt)
    enemy.flash=maxf(0,enemy.flash-dt)
    enemy.attack_flash=maxf(0,enemy.attack_flash-dt)
    enemy.guard_t=maxf(0,enemy.guard_t-dt)
    enemy.poise=maxf(0,enemy.poise-dt)
    enemy.evade_cd=maxf(0,enemy.evade_cd-dt)
    enemy.mobility_cd=maxf(0,enemy.mobility_cd-dt)
    enemy.kneel=maxf(0,enemy.kneel-dt)
    var old_x:float=enemy.x
    var was_airborne:bool=enemy.y>0
    enemy.x=clampf(enemy.x+enemy.knock*dt,30,930)
    enemy.knock=move_toward(float(enemy.knock),0,maxf(1,absf(enemy.knock))*8*dt)
    if enemy.y>0 or enemy.vy>0:
        enemy.vy-=1600*dt;enemy.y=maxf(0,enemy.y+enemy.vy*dt)
        if enemy.y<=0:enemy.vy=0.0
    if boss.transition>0:return
    var mobility:Dictionary=Rules.MOBILITY[life]
    if enemy.kneel>0:return
    enemy.ability_cd-=dt
    if enemy.ability_t>0:
        enemy.ability_t-=dt
        if enemy.ability_t<=0:_enemy_ability()
    elif enemy.ability_cd<=0 and enemy.state not in ["hurt","evade","dash"] and enemy.windup<=0:
        enemy.ability_t=Rules.ABILITY_TELL[life]
        enemy.ability_cd=Rules.ABILITY_CD[life]+enemy.ability_t
    if enemy.state=="hurt":
        enemy.t-=dt
        if enemy.t<=0:
            enemy.state="attack";enemy.windup=0.0
            if life>0:enemy.poise=0.65
        return
    if enemy.state=="evade":
        enemy.t-=dt
        if enemy.t<=0:enemy.state="attack";enemy.windup=0.0
        return
    if enemy.state=="dash":
        enemy.t-=dt
        enemy.x=clampf(enemy.x+enemy.dash_dir*mobility.speed*dt,32,928)
        if int(combat_clock*24)!=int((combat_clock-dt)*24):_trail(visitor,Rules.COLORS[life])
        if enemy.t<=0 or (absf(enemy.x-boss.x)<80 and life not in [3,6]):
            enemy.state="attack";enemy.windup=0.0;enemy.chain_left=mobility.chain
            enemy.poise=0.34
    elif enemy.state=="backoff":
        enemy.t-=dt
        if enemy.t<=0:
            enemy.state="attack" if enemy.chain_left>0 else "wait"
    elif enemy.state=="wait":
        enemy.decision-=dt
        if enemy.decision<=0:
            enemy.state="attack";enemy.windup=0.0
            enemy.chain_left=mobility.chain
    elif enemy.state=="attack":
        var melee:Dictionary=Rules.MELEE[life]
        var delta_x:float=boss.x-enemy.x
        var distance:float=absf(delta_x)
        var side:float=signf(delta_x)
        if enemy.windup<=0 and enemy.mobility_cd<=0 and enemy.ability_t<=0 and distance>melee.reach+60 and life>0:
            _enemy_dash(side)
        elif enemy.ability_t<=0:
            if enemy.windup<=0:
                var target:float=boss.x-side*(34+melee.reach*0.42)
                enemy.x=move_toward(float(enemy.x),target,enemy.speed*1.7*dt)
            if distance<52+melee.reach or enemy.windup>0:
                enemy.windup+=dt
                var tell:float=melee.tell*(0.86 if enemy.combo_index>0 else 1.0)
                if enemy.windup>=tell:
                    enemy.attack_flash=0.18
                    enemy.strikes+=1
                    _fx(maxi(0,life-1),Vector2(enemy.x+side*melee.reach*0.50,FLOOR-enemy.y-40),110+melee.reach,0.30,"visitor",int(side))
                    audio.sfx(_weapon_sound())
                    if absf(enemy.x-boss.x)<52+melee.reach+20 and absf(enemy.y-boss.y)<melee.height:
                        _hurt_boss(enemy.damage*(0.85 if enemy.combo_index>0 else 1.0),false,melee)
                    enemy.windup=0.0
                    enemy.chain_left=maxi(0,int(enemy.chain_left)-1)
                    if enemy.chain_left>0 and life>0:
                        enemy.combo_index+=1
                        enemy.state="backoff";enemy.t=0.14
                        enemy.decision=0.0
                    else:
                        enemy.combo_index=0
                        enemy.state="backoff";enemy.t=0.26 if life>0 else 0.65
                        var tactics:Dictionary=current_plan.get("tactics",{})
                        enemy.decision=0.32-0.20*float(tactics.get("aggression",0.55))
    if enemy.y<=0 and enemy.state not in ["dash","hurt"]:
        var old_step:int=int(enemy.stride/34.0)
        enemy.stride+=absf(enemy.x-old_x)
        if int(enemy.stride/34.0)>old_step:audio.sfx("step");enemy.steps+=1
    if was_airborne and enemy.y<=0:audio.sfx("step")

func _enemy_dash(direction:float) -> void:
    enemy.state="dash"
    enemy.dash_dir=direction if direction!=0 else 1.0
    enemy.t=Rules.MOBILITY[life].duration
    enemy.mobility_cd=Rules.MOBILITY[life].cooldown
    enemy.dashes+=1
    enemy.windup=0.0
    if life in [3,5,8] and enemy.y<=0:enemy.vy=Rules.MOBILITY[life].hop;enemy.y=1.0
    _trail(visitor,Rules.COLORS[life])
    audio.sfx("dash")

func _enemy_ability() -> void:
    enemy.ability_serial+=1
    enemy.abilities+=1
    if life==6 and enemy.mobility_cd<=0:_enemy_dash(signf(boss.x-enemy.x))
    if life==3:enemy.vy=440.0;enemy.y=maxf(1,enemy.y)
    if life in [2,5,7]:enemy.guard_t=0.65
    var origin=Vector2(enemy.x,enemy.y+42)
    var target=Vector2(boss.x,boss.y+42)
    for p in Rules.enemy_shots(life,origin,target,enemy.ability_serial):
        _projectile(p.p,p.v,p.radius,p.low,enemy.damage*p.scale,false,life,p)
    audio.sfx(_weapon_sound())
    _fx(maxi(0,life-1),Vector2(enemy.x,FLOOR-enemy.y-40),120,0.35,"visitor",1 if boss.x>enemy.x else -1)

func _weapon_sound() -> String:
    return "chain" if life==2 else "wood" if life==0 else "ice" if life==7 else "magic" if life==4 else "sword"

func _hurt_boss(damage:float,low:bool,weapon:Dictionary={}) -> void:
    if boss.invuln>0 or boss.transition>0:return
    if low and boss.y>34:return
    var guarded:bool=boss.guarding and not low
    if guarded:
        damage*=0.22
        boss.blocks+=1
        boss.guard=maxf(0,boss.guard-0.10-float(weapon.get("guard",0)))
        audio.sfx("guard")
        _fx(3,Vector2(boss.x,FLOOR-boss.y-75),180,0.27,"royal")
    else:
        audio.sfx("hit")
        _blood(Vector2(boss.x,FLOOR-boss.y-83))
    boss.hp-=damage
    boss.flash=0.14;boss.invuln=0.28
    boss.knock=signf(boss.x-enemy.x)*float(weapon.get("impulse",240))*(0.25 if guarded else 1.0)
    if not guarded and float(weapon.get("lift",0))>0:
        boss.vy=float(weapon.lift);boss.grounded=false
    hitstop=0.025
    if not boss.phase_triggered and boss.hp<=350 and boss.hp>0:_begin_crown_stance()

func _begin_crown_stance() -> void:
    if boss.get("phase_triggered",false):return
    boss.phase_triggered=true
    phase_started=combat_clock
    boss.transition=1.8
    boss.invuln=1.8
    boss.y=0.0;boss.vy=0.0;boss.grounded=true
    move.clear()
    for p in projectiles:
        if is_instance_valid(p.sprite):p.sprite.queue_free()
    projectiles.clear()
    _fx(4,Vector2(boss.x,FLOOR-75),350,1.6,"nova")
    audio.sfx("magic")

func _projectile(pos:Vector2,velocity:Vector2,radius:float,low:bool,damage:float,friendly:bool,style:int,extra:Dictionary={}) -> void:
    var sprite=Sprite2D.new()
    sprite.texture_filter=CanvasItem.TEXTURE_FILTER_NEAREST
    sprite.z_index=10
    add_child(sprite)
    var kind="royal" if friendly else "visitor"
    var row=1 if friendly else maxi(0,style-1)
    sprite.texture=Actor.effect_texture(row,0,kind)
    var size=90.0 if friendly else maxf(58,radius*4)
    if sprite.texture:sprite.scale=Vector2(size/sprite.texture.get_width(),size/sprite.texture.get_height())
    projectiles.append({"p":pos,"v":velocity,"r":radius,"low":low,"damage":damage,"friendly":friendly,
        "sprite":sprite,"kind":kind,"row":row,"ttl":float(extra.get("ttl",2.8)),
        "gravity":float(extra.get("gravity",0)),"return_at":float(extra.get("return_at",0)),
        "distance":0.0,"returning":false})

func _projectile_step(dt:float) -> void:
    for p in projectiles.duplicate():
        p.ttl-=dt
        if p.return_at>0:
            p.distance+=p.v.length()*dt
            if p.distance>=p.return_at:p.returning=true
            if p.returning:
                p.v=(Vector2(enemy.x,enemy.y+42)-p.p).normalized()*390
                if p.p.distance_to(Vector2(enemy.x,enemy.y+42))<24:p.ttl=0
        p.v.y-=p.gravity*dt
        p.p+=p.v*dt
        p.sprite.position=Vector2(p.p.x,FLOOR-p.p.y)
        p.sprite.texture=Actor.effect_texture(p.row,int(elapsed*15)%6,p.kind)
        p.sprite.flip_h=p.v.x<0 if not p.friendly else false
        if p.friendly:p.sprite.rotation=Vector2(p.v.x,-p.v.y).angle()+PI
        var dead:bool=p.ttl<=0 or p.p.x<-100 or p.p.x>1060 or p.p.y < -100
        if not dead:
            if p.friendly:
                if absf(p.p.x-enemy.x)<p.r+12 and absf(p.p.y-(enemy.y+26))<p.r+24:
                    _hit_enemy(p.damage,"throw");dead=true
            elif absf(p.p.x-boss.x)<p.r+18 and (boss.y<35 if p.low else absf(p.p.y-(boss.y+42))<p.r+22):
                _hurt_boss(p.damage,p.low);dead=true
        if dead:
            p.sprite.queue_free()
            projectiles.erase(p)

func _tutorial_complete() -> bool:
    return boss.jumps>0 and boss.dashes>0 and boss.blocks>0

func _animate() -> void:
    var motion="idle"
    var frame=int(elapsed*5)%6
    if mode=="arrival":
        var t=clampf(mode_t/1.3,0,1)
        king.position=Vector2(lerpf(880,boss.x,t),lerpf(422,FLOOR-boss.y,t))
        if t<1:motion="rise"
    else:
        king.position=Vector2(roundf(boss.x),roundf(FLOOR-boss.y))
        if boss.dash>0:motion="dash";frame=mini(5,int((1-boss.dash/0.17)*6))
        elif not boss.grounded:motion="jump";frame=1 if boss.vy>180 else 3 if boss.vy> -180 else 5
        elif absf(boss.vx)>20:motion="run";frame=int(boss.stride/13.0)%6
        if not move.is_empty():
            motion="combo_"+str(move.combo) if move.id=="cleave" else move.id
            var duration:float=move.spec[move.stage]
            frame=mini(1,int(move.t/maxf(0.01,duration)*2)) if move.stage=="tell" else mini(4,2+int(move.t/maxf(0.01,duration)*3)) if move.stage=="active" else 5
        if boss.transition>0:motion="transform";frame=mini(5,int((1-boss.transition/1.8)*6))
    king.who="ascended" if phase==2 or boss.transition<0.9 and boss.transition>0 else "king"
    king.pose(motion,frame,boss.facing,143)
    king.modulate=Color("#ffb9a5") if boss.flash>0 else Color.WHITE
    # Impact leans recover immediately; locomotion never leaves an accumulated rotation.
    king.rotation=-boss.facing*0.05 if boss.flash>0 else 0.0
    if boss.dash>0 and elapsed-trail_t>0.04:
        trail_t=elapsed;_trail(king,Color("#7de9ff") if phase==2 else Color("#ffdc7e"))
    var em="idle"
    var ef=int(elapsed*3.5)%6
    if enemy.state in ["enter","attack"]:em="run";ef=int(enemy.stride/9.0)%6
    if enemy.state in ["dash","evade"]:em="dash";ef=int(elapsed*22)%6
    if enemy.y>2:em="jump";ef=1 if enemy.vy>150 else 4
    if enemy.windup>0:em="cleave";ef=mini(2,int(enemy.windup/Rules.MELEE[life].tell*3))
    if enemy.ability_t>0:em="throw";ef=mini(2,int((1-enemy.ability_t/Rules.ABILITY_TELL[life])*3))
    elif enemy.attack_flash>0:em="cleave";ef=3+mini(2,int((1-enemy.attack_flash/0.18)*3))
    if enemy.state=="hurt":em="hurt";ef=mini(5,int((0.20-enemy.t)/0.20*6))
    visitor.position=Vector2(roundf(enemy.x),roundf(FLOOR-enemy.y))
    visitor.pose(em,ef,1 if boss.x>enemy.x else -1,61 if life==0 else 85 if life==8 else 78)
    visitor.rotation=deg_to_rad(float(enemy.combo_index)*-7.0) if enemy.attack_flash>0 else 0.0
    visitor.modulate=Color("#ffb3ab") if enemy.flash>0 else Color.WHITE
    ward.visible=boss.guarding and mode=="fight"
    ward.texture=Actor.effect_texture(3,int(elapsed*10)%6,"royal")
    ward.position=Vector2(roundf(boss.x),roundf(FLOOR-boss.y-76))
    if ward.texture:ward.scale=Vector2.ONE*(170.0/ward.texture.get_width())
    ward.modulate=Color("#ffe6a3") if phase==1 else Color("#abebff")
    enemy_ward.visible=enemy.guard_t>0
    enemy_ward.texture=ward.texture
    enemy_ward.position=Vector2(roundf(enemy.x),roundf(FLOOR-enemy.y-38))
    if ward.texture:enemy_ward.scale=Vector2.ONE*(110.0/ward.texture.get_width())
    enemy_ward.modulate=Rules.COLORS[life]

func _hud() -> void:
    if mode not in ["fight","arrival","paused"]:return
    var names:Array=[]
    for key in ["cleave","throw","reap","nova"]:names.append(Rules.move_spec(key,phase).name)
    ui.set_hud({"player_hp":boss.hp,"player_max":boss.max,"enemy_hp":enemy.hp,"enemy_max":enemy.max,
        "enemy_name":"???","year":Rules.YEARS[fight_index],"phase":phase,"guard":boss.guard,
        "cooldowns":boss.cooldowns,"move_names":names,
        "hint":"Jump · Dash · Block a hit" if life==0 and not _tutorial_complete() else ""})

func _royal_fx(id:String,pos:Vector2,stance:int) -> Sprite2D:
    var row=0 if id=="cleave" else 1 if id=="throw" else 2 if id=="reap" else 4
    var effect=_fx(row,pos,240 if id!="reap" else 190,0.36 if id!="reap" else 0.46,"royal" if row<4 else "nova",boss.facing)
    if stance==2:
        effect.modulate=Color("#88dfff") if id!="nova" else Color("#c89dff")
        effect.scale*=1.22
        if id=="reap":effect.rotation=PI*0.5
    return effect

func _fx(row:int,pos:Vector2,width:float=160,duration:float=0.32,kind:String="royal",direction:int=1) -> Sprite2D:
    var sprite=Sprite2D.new()
    sprite.texture=Actor.effect_texture(row,0,kind)
    sprite.texture_filter=CanvasItem.TEXTURE_FILTER_NEAREST
    sprite.position=pos
    sprite.flip_h=(direction>0 if kind=="royal" and row==1 else direction<0)
    sprite.z_index=15
    if sprite.texture:sprite.scale=Vector2.ONE*(width/sprite.texture.get_width())
    add_child(sprite)
    effects.append({"sprite":sprite,"t":0.0,"duration":duration,"row":row,"kind":kind,"alpha":1.0,"velocity":Vector2.ZERO})
    return sprite

func _blood(pos:Vector2) -> void:
    _fx(0,pos,125,0.44,"blood")
    _fx(1,pos,85,0.24,"blood")

func _trail(actor,color:Color) -> void:
    var source=actor.get_node_or_null("ActorSprite")
    if not source is Sprite2D:return
    var s=Sprite2D.new()
    s.texture=source.texture
    s.offset=source.offset
    s.position=actor.position+source.position*actor.scale
    s.scale=actor.scale*source.scale
    s.flip_h=source.flip_h
    s.texture_filter=CanvasItem.TEXTURE_FILTER_NEAREST
    s.modulate=color
    s.z_index=5
    add_child(s)
    effects.append({"sprite":s,"t":0.0,"duration":0.22,"row":-1,"kind":"","alpha":0.45,"velocity":Vector2.ZERO})

func _update_effects(dt:float) -> void:
    for effect in effects.duplicate():
        effect.t+=dt
        var sprite:Sprite2D=effect.sprite
        var p:float=effect.t/effect.duration
        if p>=1 or not is_instance_valid(sprite):
            if is_instance_valid(sprite):sprite.queue_free()
            effects.erase(effect)
            continue
        if effect.row>=0:sprite.texture=Actor.effect_texture(effect.row,mini(5,int(p*6)),effect.kind)
        sprite.position+=effect.velocity*dt
        sprite.modulate.a=effect.alpha*(1.0 if p<0.72 else (1-p)/0.28)

func _clear_effects() -> void:
    for effect in effects:
        if is_instance_valid(effect.sprite):effect.sprite.queue_free()
    effects.clear()
    for p in projectiles:
        if is_instance_valid(p.sprite):p.sprite.queue_free()
    projectiles.clear()

func _win_encounter() -> void:
    if mode!="fight":return
    completed.append(Rules.LIVES[life])
    var summary={"fight":fight_index+1,"fightIndex":fight_index+1,"lifeId":Rules.LIVES[life],
        "timeAliveMs":int(combat_clock*1000),"damageDealt":damage_dealt,"moveCounts":move_counts.duplicate(),
        "moveCountsByPhase":phase_counts.duplicate(true),
        "firstMoves":first_moves.duplicate(),"topBigrams":_top_bigrams(),"killingMove":move.get("id",null),"avgDistance":distance_sum/maxi(1,distance_samples),
        "shiftsPerMin":shift_count*60.0/maxf(0.1,combat_clock),"novaAtBossHpPct":nova_hp.duplicate(),"phase2ReachedAtSec":phase_started if phase_started>=0 else null,
        "diedInPhase":phase,"bossMinHpPct":minimum_hp,"directorAdjust":0.0,
        "outcome":"challenger_dead","hesitations":0,"remaining":[]}
    history.append(summary)
    _save_run()
    if fight_index==8:_finish("victory");return
    var token=epoch
    mode="death"
    enemy.hp=0
    _blood(visitor.position+Vector2(0,-40))
    await _pause(0.20 if autoplay else 0.85)
    if token!=epoch:return
    visitor.visible=false
    ui.hide_hud()
    _clear_effects()
    mode="waiting";stage="centuries";mode_t=0.0
    audio.music("years")
    var old_year:int=Rules.YEARS[fight_index]
    fight_index+=1
    message.text=str(Rules.YEARS[fight_index]-old_year)+" years."
    if fight_index>=7:
        life=fight_index
        current_plan={"source":"authored","tactics":{"aggression":0.8,"distance":"mid"}}
    else:
        var remaining:Array[String]=[]
        for index in range(1,7):
            if not Rules.LIVES[index] in completed:remaining.append(Rules.LIVES[index])
        if params.get("mode","heuristic")=="scripted":
            current_plan={"life":remaining[0],"source":"scripted","tactics":{"aggression":0.55,"distance":"mid"}}
        else:
            var worker=str(params.get("worker","")).uri_decode() if params.get("mode","")=="live" else ""
            current_plan=await planner.choose_next(summary,history.slice(0,-1),remaining,fight_index+1,bond,worker)
            if token!=epoch:return
        life=Rules.LIVES.find(str(current_plan.get("life",remaining[0])))
        if life<1 or not Rules.LIVES[life] in remaining:life=Rules.LIVES.find(remaining[0])
    await _pause(0.25 if autoplay else 7.0)
    if token!=epoch:return
    message.text=""
    _encounter()
func _finish(kind:String) -> void:
    if mode!="fight":return
    var token=epoch
    mode="ending";stage="silence";ending=kind;ending_ready=false
    _save_run()
    ui.hide_hud()
    _clear_effects()
    ward.visible=false;enemy_ward.visible=false
    boss.guarding=false
    king.visible=true;visitor.visible=true
    king.position=Vector2(755,FLOOR)
    visitor.position=Vector2(570,FLOOR)
    king.pose("idle",0,-1,143)
    visitor.pose("idle",0,1,100)
    audio.music("finale")
    await _pause(0.65)
    if token!=epoch:return
    if kind=="victory":
        stage="last-strike"
        king.pose("cleave",4,-1,143)
        _fx(0,Vector2(630,FLOOR-55),245,0.45,"royal",-1)
        audio.sfx("sword")
        _blood(visitor.position+Vector2(0,-50))
        visitor.pose("hurt",5,1,100)
        var fallen=create_tween()
        fallen.tween_property(visitor,"rotation",-1.45,0.4)
        fallen.parallel().tween_property(visitor,"position",Vector2(530,FLOOR-23),0.4)
        await _pause(1.2)
        if token!=epoch:return
        king.pose("idle",0,-1,143)
        await ui.speak("THE IMMORTAL","Is there no one else?","king",2.2)
        if token!=epoch:return
    else:
        if phase==2:
            stage="crown-shattered"
            for n in range(5,-1,-1):
                king.pose("transform",n,-1,143)
                await _pause(0.10)
                if token!=epoch:return
            king.who="king"
            king.pose("idle",0,-1,143)
        stage="approach"
        visitor.pose("run",3,1,100)
        create_tween().tween_property(visitor,"position:x",670.0,0.65)
        await _pause(0.65)
        if token!=epoch:return
        king.visible=false;visitor.visible=false
        finisher.visible=true
        finisher.position=Vector2(710,FLOOR)
        finisher.offset=Vector2(0,-112)
        finisher.scale=Vector2.ONE
        for n in range(6):
            finisher.texture=Actor.finisher_texture(n)
            stage="held-heart" if n>=3 else "grip" if n<2 else "pierce"
            if n==2:
                audio.sfx("stab")
                _blood(Vector2(750,FLOOR-83))
            if n>=3:_blood(Vector2(752,FLOOR-81))
            await _pause(0.24)
            if token!=epoch:return
        stage="held-heart"
        await ui.speak("THE IMMORTAL","Then die with it.","king",2.0)
        if token!=epoch:return
        stage="decree"
        for n in range(6,10):
            finisher.texture=Actor.finisher_texture(n)
            _blood(Vector2(752,FLOOR-82))
            _fx(4,Vector2(752,FLOOR-80),120+(n-6)*45,0.65,"nova")
            await _pause(0.27)
            if token!=epoch:return
        stage="explosion"
        finisher.texture=Actor.finisher_texture(10)
        audio.sfx("nova")
        _fx(4,Vector2(752,FLOOR-83),850,1.2,"nova")
        for n in range(18):
            var debris=_fx(4,Vector2(752,FLOOR-83),18+(n%4)*10,0.65+(n%3)*0.2,"visitor",1)
            effects[-1].velocity=Vector2.from_angle(float(n)*TAU/18)*float(180+n*16)
            debris.modulate=Color("#bdc5c2")
        await _pause(0.22)
        if token!=epoch:return
        # Matched intact/ruined arena sprites dissolve behind the blast; never cut to a town.
        create_tween().tween_property(ruins,"modulate:a",1.0,0.75)
        finisher.texture=Actor.finisher_texture(11)
        await _pause(0.45)
        if token!=epoch:return
        finisher.visible=false
        stage="ruined-arena"
        await _pause(1.6)
        if token!=epoch:return
    stage="coda";ending_ready=true
    message.text=("VICTORY" if kind=="victory" else "THE NINTH LIFE")+"\n[ Enter ] Return"
    _publish_state()

func _publish_state() -> void:
    if not OS.has_feature("web"):return
    var labels:Array=[]
    for label in ui.get("_move_labels"):labels.append(label.text)
    var state={"engine":"Godot 4.7.2","mode":mode,"stage":stage,"life":fight_index+1,"visitor":Rules.LIVES[life],"planner":current_plan.get("source","authored"),"phase":phase,
        "x":boss.get("x",800),"y":boss.get("y",0),"boss_hp":boss.get("hp",700),"enemy_hp":enemy.get("hp",260),
        "guarding":boss.get("guarding",false),"jumps":boss.get("jumps",0),"dashes":boss.get("dashes",0),
        "blocks":boss.get("blocks",0),"choice_step":choice_step,"ending":ending,"ready":ending_ready,
        "year":Rules.YEARS[fight_index],"completed":completed,"waiting_bored":mode=="waiting",
        "dialogue":ui.get("reading"),"choices":ui.get("choosing"),"muted":audio.get("muted"),
        "choice_options":ui.get("choice_options"),"selected_choice":ui.get("selected_choice"),
        "planner_trace":current_plan,"history_size":history.size(),
        "bindings":ui.get_bindings(),"settings":ui.get("_menu_page"),"menu_page":ui.get("_menu_page"),
        "hud_visible":ui.get("_hud").visible,"move_labels":labels,
        "combo":boss.get("combo",0),"combo_history":boss.get("combo_history",[]),"active_move":move.get("id",""),"move_stage":move.get("stage",""),
        "enemy_state":enemy.get("state",""),"enemy_dashes":enemy.get("dashes",0),"enemy_strikes":enemy.get("strikes",0),"enemy_abilities":enemy.get("abilities",0),
        "vx":boss.get("vx",0),"vy":boss.get("vy",0),"grounded":boss.get("grounded",true),"king_sprite_path":king.sprite.texture.atlas.resource_path if king.sprite.texture is AtlasTexture else "",
        "player_steps":boss.get("steps",0),"enemy_steps":enemy.get("steps",0),"king_actor":king.who,
        "waiting_pose":"rest" if mode=="waiting" and absf(king.position.x-880.0)<2 else "",
        "music":audio.get("current_cue")}
    JavaScriptBridge.eval("window.ninthState="+JSON.stringify(state)+";",true)

func _top_bigrams() -> Array:
    var counts:Dictionary={}
    for n in range(sequence.size()-1):
        var key=str(sequence[n])+">"+str(sequence[n+1])
        counts[key]=int(counts.get(key,0))+1
    var out:Array=[]
    for key in counts:
        var pair=str(key).split(">")
        out.append([pair[0],pair[1],counts[key]])
    out.sort_custom(func(a,b):return a[2]>b[2])
    return out.slice(0,3)

func _save_run() -> void:
    var file=FileAccess.open("user://latest-run.json",FileAccess.WRITE)
    if file:
        file.store_string(JSON.stringify({"engine":"Godot 4.7.2","ending":ending,
            "completed":completed,"summaries":history,"last_plan":current_plan,"bond":bond}, "  "))
        file.close()
        if OS.has_feature("web"):JavaScriptBridge.force_fs_sync()