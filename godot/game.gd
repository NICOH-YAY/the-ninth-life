# AI-use disclosure: Codex-authored native Godot gameplay port and revised royal sprite staging.
extends Node2D
const Rules = preload("res://combat_rules.gd")
const Actor = preload("res://actor_view.gd")
const FLOOR = 464.0
const THRONE = Vector2(885,384)
var tell_markers:Array=[]
var spirits_released=0
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
var powers
var entrances
var trauma=0.0
var king_shadow:Sprite2D
var visitor_shadow:Sprite2D

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
    powers=load("res://power_director.gd").new()
    powers.game=self
    add_child(powers)
    entrances=load("res://entrance_director.gd").new()
    entrances.game=self
    add_child(entrances)
    king_shadow=_ground_shadow(42)
    visitor_shadow=_ground_shadow(27)
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
    if powers:powers.dispel()
    if entrances:entrances.clear()
    if king_shadow:king_shadow.visible=false
    if visitor_shadow:visitor_shadow.visible=false
    ui.reset()
    ui.hide_hud()
    ui.show_menu("res://art/menu-memory-v8.png")
    audio.music("menu")
    audio.set_tension(0.0)

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
    spirits_released=0
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
        "guard_max":1.0,"guard_exhausted":false,"guard_broken":0.0,"guard_breaks":0,"regen_delay":0.0,"bound":0.0,"vow":false,"attack_gain":1.0,
        "facing":-1,"grounded":true,"dash":0.0,"dash_cd":0.0,"invuln":0.0,"guard":1.0,
        "guard_age":99.0,"guard_held":false,"guard_perfect_used":false,"guard_rearm":0.0,"perfect_blocks":0,"counter_hits":0,"counter_window":0.0,"cancels":0,"guarding":false,"flash":0.0,"inactive":0.0,"jumps":0,"dashes":0,"blocks":0,
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
        "flash":0.0,"invuln":0.0,"poise":Rules.POISE[life],"poise_max":Rules.POISE[life],"poise_delay":0.0,"stagger_lock":0.0,"poise_breaks":0,"guard":1.0,"guard_facing":1.0,"attack_dir":1.0,"ability_target":Vector2.ZERO,"evade_cd":0.0,"guard_t":0.0,
        "kneel":0.0,"armored":life==5,"mobility_cd":0.8,"dash_dir":1.0,"chain_left":1,"combo_index":0,
        "dashes":0,"strikes":0,"abilities":0,"stride":0.0,"steps":0,"blood_boost":0.0,"power_count":0,"ultimate_count":0,"cost_paid":0.0}
    if powers:powers.reset(life)
    if entrances:entrances.clear()
    move.clear()
    phase=1
    combat_clock=0.0
    input_edges.clear()
    _clear_effects()

func _opening() -> void:
    var token=epoch
    mode="opening"
    stage="levy"
    audio.music("years")
    king.who="king"
    king.visible=true
    visitor.visible=true
    king.rotation=0.0
    king.position=THRONE
    visitor.setup("alley")
    visitor.position=Vector2(90,FLOOR)
    king.pose("nova",2,-1,143)
    visitor.visible=false
    var petitioners:Array=[]
    for n in range(3):
        var citizen=Actor.new()
        add_child(citizen)
        citizen.setup(["kitten","sailor","quiet"][n])
        citizen.position=Vector2(320+n*55,FLOOR)
        citizen.pose("idle",n,1,61)
        petitioners.append(citizen)
    await ui.speak("THE CROWNED ONE","Seal the river gates. No grain until the levy is paid.","king",2.6)
    if token!=epoch:
        for citizen in petitioners:citizen.queue_free()
        return
    king.pose("nova",4,-1,143)
    _fx(2,Vector2(430,FLOOR-35),310,0.65,"royal")
    audio.sfx("magic");trauma=4.0
    for citizen in petitioners:
        citizen.pose("hurt",3,-1,61)
        create_tween().tween_property(citizen,"position:x",citizen.position.x-110,0.45)
    await _pause(0.55)
    for citizen in petitioners:citizen.queue_free()
    if token!=epoch:return
    visitor.visible=true
    stage="arrival"
    king.pose("idle",0,-1,143)
    create_tween().tween_property(visitor,"position:x",490.0,1.2)
    await _pause(1.25)
    if token!=epoch:return
    stage="challenge"
    await ui.speak("YOU","The lower ward is starving. Open the stores and step down.","alley",2.6)
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
    await ui.speak("YOU","I will not rule like you.","alley",2.1)
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
    king.position=THRONE
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
    mode="entrance"
    mode_t=0.0;choice_step=0
    king.visible=true;visitor.visible=true
    king.modulate=Color.WHITE;visitor.modulate=Color.WHITE
    king.rotation=0.0;visitor.rotation=0.0
    visitor.setup(Rules.LIVES[life])
    await entrances.enter(life,token)
    if token!=epoch:return
    mode="arrival";mode_t=1.3
    stage="conversation"
    var history:Array=[]
    var script_data:Dictionary=content.get(Rules.LIVES[life],{})
    var speaker:String="A MEMORY" if script_data.get("voice","")=="memory_whisper" else "???"
    for step in range(2):
        choice_step=step+1
        var branch:Dictionary
        if step==0: branch=script_data.get("first",{})
        else: branch=script_data.get("second",[{},{}])[0 if history[0] else 1]
        var options:Array=branch.get("choices",["I remember.","Raise your weapon."])
        if not autoplay:
            await ui.speak(speaker,branch.get("question","You are still here."),Rules.LIVES[life],2.1)
            if token!=epoch:return
        var open=true
        if not autoplay:
            open=await ui.choose(options)
            if token!=epoch:return
        if step==0 and open and int(script_data.get("vow_choice",0))==0:
            boss.vow=true;boss.guard_max=0.5;boss.guard=minf(boss.guard,0.5);boss.attack_gain=1.15
        history.append(open)
        bond=clampi(bond+(1 if open else -1),0,8)
        if not autoplay:
            await ui.speak("THE IMMORTAL",str(options[0 if open else 1]),"king",1.8)
            if token!=epoch:return
            var response=str(branch.get("responses",["Then look at me.","Then fight."])[0 if open else 1])
            if bond>=4:response+=" "+str(script_data.get("remembered",""))
            await ui.speak(speaker,response,Rules.LIVES[life],2.0)
            if token!=epoch:return
    if life==0 and not autoplay:
        await ui.speak("?? / ??","I jumped the levy poles and ran the raids. Catch my blow, king.","kitten",2.0)
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
    if debug_mode and mode in ["entrance","arrival","fight","waiting"]:
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
    trauma=maxf(0,trauma-dt*20.0)
    position=Vector2(roundf(sin(elapsed*63)*trauma),roundf(cos(elapsed*47)*trauma*0.55))
    mode_t+=dt
    _update_effects(dt)
    if mode=="arrival":
        if enemy.state=="enter":
            var previous_x:float=enemy.x
            enemy.x=move_toward(float(enemy.x),90.0,145.0*dt*speed)
            var previous_step:int=int(enemy.stride/42.0)
            enemy.stride+=absf(enemy.x-previous_x)
            if int(enemy.stride/42.0)>previous_step:audio.sfx("step");enemy.steps+=1
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
        king.position.x=move_toward(king.position.x,THRONE.x,220.0*dt)
        var climb=clampf((king.position.x-760.0)/125.0,0.0,1.0)
        king.position.y=lerpf(FLOOR,THRONE.y,climb)
        var seated=absf(king.position.x-THRONE.x)<2.0
        king.pose("rest" if seated else "run",int(elapsed*(1.3 if seated else 15.0))%(6 if seated else 12),-1 if seated else 1,143)
    elif mode=="opening" and stage=="arrival":
        visitor.pose("run",int(elapsed*15)%12,1,90)
    publish_t+=dt
    if publish_t>=(0.03 if debug_mode else 0.1):
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
    for hazard in powers.debug_state().hazards:
        if not hazard.real:continue
        var imminent:bool=hazard.active or hazard.tell<0.65
        if imminent and absf(boss.x-hazard.x)<hazard.width*0.5+75:
            if hazard.low:
                if boss.grounded:i.jump=true
                i.guard=false
            else:
                var away:int=-1 if boss.x<hazard.x else 1
                if boss.x<160:away=1
                elif boss.x>800:away=-1
                i.left=away<0;i.right=away>0;i.guard=false
                if hazard.tell<0.14 and boss.dash_cd<=0:i.dash=true
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
    powers.tick(dt)
    var tension:float=0.30 if enemy.windup>0 or enemy.ability_t>0 or not move.is_empty() and move.stage=="tell" else 0.60
    if boss.hp/boss.max<0.30 or powers.debug_state().casting_ultimate:tension=0.88
    audio.set_tension(tension)
    if boss.hp<=0:_finish("normal")
    elif enemy.hp<=0:_win_encounter()

func _player_step(i:Dictionary,dt:float) -> void:
    var direction=(-1 if i.left else 0)+(1 if i.right else 0)
    var floor_height:float=56.0 if phase==2 else 0.0
    var supported:bool=boss.grounded or phase==2 and boss.y<=floor_height+4 and boss.vy<=0
    var was_supported:bool=supported
    var cancellable:bool=move.is_empty() or move.stage=="tell"
    var guard_edge:bool=i.guard and not boss.guard_held
    boss.guard_age+=dt
    boss.guard_rearm=maxf(0,boss.guard_rearm-dt)
    boss.guard_broken=maxf(0,boss.guard_broken-dt)
    boss.regen_delay=maxf(0,boss.regen_delay-dt)
    boss.bound=maxf(0,boss.bound-dt)
    boss.counter_window=maxf(0,boss.counter_window-dt)
    if guard_edge and boss.guard_rearm<=0:
        boss.guard_age=0.0;boss.guard_perfect_used=false;boss.guard_rearm=0.34
    boss.guard_held=i.guard
    var action_locked:bool=boss.guard_broken>0.45 or boss.land>0.065
    if guard_edge and not move.is_empty() and move.stage=="tell":
        move.clear();boss.combo_queue=0;boss.cancels+=1
    if direction!=0 and direction!=last_direction:
        shift_count+=1
        last_direction=direction
    if direction!=0 and move.is_empty():boss.facing=direction
    boss.coyote=0.10 if supported else maxf(0,boss.coyote-dt)
    boss.jump_buffer=0.24 if i.jump else maxf(0,boss.jump_buffer-dt)
    boss.input_buffer=maxf(0,boss.input_buffer-dt)
    boss.combo_buffer=maxf(0,boss.combo_buffer-dt)
    if boss.combo_buffer<=0:boss.combo_queue=0
    var taps:int=int(i.get("cleave_taps",0))
    if taps>0 and not action_locked:
        boss.combo_queue=mini(2,int(boss.combo_queue)+taps)
        boss.combo_buffer=2.2
    for id in ["nova","reap","throw"]:
        if i[id] and not action_locked:
            boss.buffered_action=id;boss.input_buffer=0.24
            break
    if boss.jump_buffer>0 and boss.coyote>0 and boss.dash<=0 and cancellable and not action_locked:
        if not move.is_empty():move.clear();boss.combo_queue=0;boss.cancels+=1
        boss.vy=470.0 if phase==2 else 560.0;boss.grounded=false;boss.jumps+=1
        boss.jump_buffer=0.0;boss.coyote=0.0
        audio.sfx("jump")
    if not bool(i.get("jump_held",true)) and boss.vy>230:
        boss.vy=move_toward(float(boss.vy),230.0,2400.0*dt)
    if i.dash and boss.dash_cd<=0 and cancellable and not action_locked:
        if direction!=0:boss.facing=direction
        boss.dash=0.18;boss.dash_cd=0.70;boss.invuln=maxf(boss.invuln,0.18);boss.dashes+=1
        boss.combo_queue=0
        if not move.is_empty():boss.cancels+=1
        move.clear()
        audio.sfx("dash")
        _trail(king,Color("#6fe7ff") if phase==2 else Color("#ffc976"))
    boss.guarding=i.guard and move.is_empty() and boss.dash<=0 and boss.guard_broken<=0
    if boss.guarding:
        boss.guard=maxf(0,boss.guard-0.30*dt)
        if boss.guard<=0:
            boss.guard_exhausted=true
            boss.regen_delay=0.65
    elif not i.guard and boss.regen_delay<=0:
        boss.guard=minf(boss.guard_max,boss.guard+0.26*dt)
        if boss.guard>=boss.guard_max*0.30:boss.guard_exhausted=false
    if boss.dash>0:
        boss.dash=maxf(0,boss.dash-dt)
        boss.vx=boss.facing*lerpf(650.0,920.0,boss.dash/0.18)
    else:
        var target:float=direction*(220.0 if phase==2 else 245.0)
        if boss.guarding:target*=0.42
        if boss.bound>0:target*=0.55
        if boss.guard_broken>0:target*=0.25
        if boss.land>0:target*=0.35
        if not move.is_empty():target*=0.45 if move.stage=="tell" else 0.18
        var acceleration:float=2100.0 if phase==1 else 850.0
        if direction==0:acceleration=2400.0 if phase==1 else 650.0
        boss.vx=move_toward(float(boss.vx),target,acceleration*dt)
    var before:float=boss.x
    boss.x=clampf(boss.x+(boss.vx+boss.knock)*dt,48,912)
    boss.knock=move_toward(float(boss.knock),0,maxf(1,absf(boss.knock))*8*dt)
    if phase==2:
        boss.grounded=false
        if boss.vy>0 or boss.y>60:
            boss.vy-=1500.0*dt
            boss.y+=boss.vy*dt
            if boss.y<=56:boss.y=56.0;boss.vy=0.0
        else:
            boss.vy=0.0
            boss.y=move_toward(float(boss.y),56.0,100.0*dt)
        supported=boss.y<=60 and boss.vy<=0
    elif not boss.grounded:
        boss.vy-=(1900.0 if boss.vy<0 else 1650.0)*dt
        boss.y+=boss.vy*dt
        if boss.y<=0:
            boss.y=0.0;boss.vy=0.0;boss.grounded=true
        supported=boss.grounded
    if phase==1 and boss.grounded and boss.dash<=0:
        var old_step:int=int(boss.stride/48.0)
        boss.stride+=absf(boss.x-before)
        if int(boss.stride/48.0)>old_step:audio.sfx("step");boss.steps+=1
    elif phase==2:boss.stride+=absf(boss.x-before)
    if not was_supported and supported and phase==1:
        audio.sfx("step")
        boss.land=0.18
        trauma=maxf(trauma,3.5)
        _fx(4,Vector2(boss.x,FLOOR-4),75,0.20,"visitor")
    boss.land=maxf(0,boss.land-dt)
    if action_locked or boss.land>0.065:return
    if boss.counter_window>0 and i.cleave and cancellable and boss.dash<=0:
        boss.guarding=false;_start_move("cleave");return
    if not boss.guarding and boss.dash<=0:
        if not move.is_empty() and move.id=="cleave" and move.stage=="recover" and move.t>=move.spec.recover*0.82:
            if boss.combo_queue>0 or i.cleave:
                move.clear();_start_move("cleave")
                boss.combo_queue=maxi(0,int(boss.combo_queue)-1);return
        if move.is_empty():
            if boss.input_buffer>0 and boss.cooldowns[boss.buffered_action]<=0:
                var action:String=boss.buffered_action
                boss.input_buffer=0.0;_start_move(action)
            elif (boss.combo_queue>0 or i.cleave) and boss.cooldowns.cleave<=0:
                _start_move("cleave")
                boss.combo_queue=maxi(0,int(boss.combo_queue)-1)

func _guard_break(damage:float) -> void:
    boss.guard_broken=1.10
    boss.guard_exhausted=false
    boss.guard=0.0
    boss.guard_breaks+=1
    boss.guarding=false
    boss.regen_delay=1.15
    boss.counter_window=0.0
    boss.combo_queue=0
    move.clear()
    boss.hp-=damage
    boss.flash=0.28;boss.invuln=0.30
    boss.knock=signf(boss.x-enemy.x)*460.0
    trauma=maxf(trauma,7.0);hitstop=0.075
    audio.pulse("poise-break")
    _fx(3,Vector2(boss.x,FLOOR-boss.y-55),210,0.45,"royal")
    _blood(Vector2(boss.x,FLOOR-boss.y-55))
    if not boss.phase_triggered and boss.hp<=350 and boss.hp>0:_begin_crown_stance()

func _start_move(id:String) -> void:
    var spec=Rules.move_spec(id,phase)
    spec.damage*=boss.attack_gain
    var counter:bool=id=="cleave" and boss.counter_window>0
    if counter:
        spec.tell=0.055;spec.active=0.075;spec.recover=0.25;spec.damage*=1.55
        boss.counter_window=0.0
    move_counts[id]=int(move_counts.get(id,0))+1
    phase_counts[str(phase)][id]+=1
    sequence.append(id)
    if first_moves.size()<8:first_moves.append(id)
    if id=="nova":nova_hp.append(boss.hp/700.0)
    # Keep movement-facing control, but turn toward a nearby target for a committed strike.
    if absf(enemy.x-boss.x)<400:boss.facing=-1 if enemy.x<boss.x else 1
    if id=="cleave":
        boss.combo=(boss.combo+1)%3 if combat_clock<=boss.combo_until else 0
        boss.combo_until=combat_clock+1.85
        if boss.combo==1:spec.tell*=0.80;spec.active*=0.90
        elif boss.combo==2:spec.tell*=1.30;spec.damage*=1.25;spec.recover*=1.25
        boss.combo_history.append(boss.combo)
    boss.cooldowns[id]=spec.cooldown
    move={"id":id,"phase":phase,"spec":spec,"stage":"tell","t":0.0,"direction":boss.facing,"target":enemy.x,"combo":boss.combo,"spawned":0,"hit":false,"marks":[],"counter":counter}
    if id=="reap" and phase==2:move.marks=[boss.x-180,boss.x,boss.x+180]
    if id=="nova" and phase==1:move.marks=[boss.x+boss.facing*90,boss.x+boss.facing*250,boss.x+boss.facing*410]
    audio.sfx("magic" if phase==2 or id in ["nova","reap"] else "sword-draw")
    if life>0 and enemy.evade_cd<=0 and not counter and enemy.state not in ["hurt","parried"]:
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
            if move.combo==1:enemy.vy=maxf(enemy.vy,320.0) if enemy.state=="hurt" else enemy.vy
            elif move.combo==2 and enemy.state=="hurt":enemy.knock=move.direction*540.0
            move.hit=true
        if phase==2 and move.spawned==0:
            move.spawned=1
            _fx(2,Vector2(boss.x,FLOOR-boss.y-50),220+move.combo*50,0.36,"royal")
    elif id=="throw":
        if phase==1:
            if not move.hit and (enemy.x-boss.x)*move.direction>-20 and absf(enemy.x-boss.x)<230 and absf(enemy.y-boss.y)<72:
                move.hit=true
                _hit_enemy(damage,id)
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
                    if enemy.hp<before and enemy.state=="hurt":
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
    var guard_hit:bool=enemy.guard_t>0 and enemy.guard>0.05 and enemy.guard_facing*(boss.x-enemy.x)>=0 and id not in ["nova","reap"]
    if guard_hit:
        enemy.guard=maxf(0,enemy.guard-0.22)
        damage*=0.24
        audio.sfx("guard")
        _fx(3,visitor.position+Vector2(0,-40),110,0.24,"royal")
    var before_hp:float=enemy.hp
    enemy.hp-=damage
    if life==0 and not _tutorial_complete():enemy.hp=maxf(1,enemy.hp)
    damage_dealt+=maxf(0,before_hp-maxf(0,enemy.hp))
    if not move.is_empty() and move.get("counter",false):boss.counter_hits+=1
    enemy.flash=0.12
    enemy.poise_delay=2.0
    var impact:float=damage*(1.30 if id=="reap" else 1.0)/(1.30 if enemy.blood_boost>0 else 1.0)
    if enemy.stagger_lock<=0:
        enemy.poise=maxf(0,enemy.poise-impact)
        if enemy.poise<=0 or guard_hit and enemy.guard<=0:_break_enemy_poise()
    # Damage still lands during armor; only a broken posture interrupts the action.
    if enemy.state=="hurt":
        enemy.knock=signf(enemy.x-boss.x)*(360 if id=="nova" else 190)
        if id in ["cleave","nova"]:enemy.vy=maxf(enemy.vy,140.0)
    else:enemy.knock=signf(enemy.x-boss.x)*28
    enemy.invuln=0.045
    _blood(Vector2(enemy.x,FLOOR-enemy.y-38))
    hitstop=0.045 if enemy.state=="hurt" else 0.026
    audio.sfx("hit")
    trauma=maxf(trauma,4.0 if enemy.state=="hurt" else 1.5)

func _break_enemy_poise() -> void:
    enemy.state="hurt";enemy.t=0.48
    powers.dispel()
    enemy.windup=0.0;enemy.ability_t=0.0
    enemy.guard_t=0.0
    enemy.stagger_lock=2.35
    enemy.poise=enemy.poise_max
    enemy.poise_breaks+=1
    audio.pulse("poise-break")
    _fx(3,Vector2(enemy.x,FLOOR-enemy.y-40),145,0.34,"royal")

func _enemy_step(dt:float) -> void:
    enemy.invuln=maxf(0,enemy.invuln-dt)
    enemy.flash=maxf(0,enemy.flash-dt)
    enemy.attack_flash=maxf(0,enemy.attack_flash-dt)
    enemy.guard_t=maxf(0,enemy.guard_t-dt)
    enemy.stagger_lock=maxf(0,enemy.stagger_lock-dt)
    enemy.poise_delay=maxf(0,enemy.poise_delay-dt)
    if enemy.poise_delay<=0:enemy.poise=minf(enemy.poise_max,enemy.poise+18*dt)
    enemy.guard=minf(1,enemy.guard+0.18*dt)
    enemy.evade_cd=maxf(0,enemy.evade_cd-dt)
    enemy.mobility_cd=maxf(0,enemy.mobility_cd-dt)
    enemy.kneel=maxf(0,enemy.kneel-dt)
    if powers.busy():return
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
    if enemy.state not in ["hurt","parried","contact","backoff","evade","dash"] and enemy.windup<=0:
        if powers.can_ultimate():
            powers.cast(true);return
        if enemy.ability_cd<=0:
            _enemy_ability();return
    if enemy.state in ["hurt","parried"]:
        enemy.t-=dt
        if enemy.t<=0:
            enemy.state="attack";enemy.windup=0.0
            enemy.poise=enemy.poise_max
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
            enemy.stagger_lock=maxf(enemy.stagger_lock,0.25)
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
                enemy.x=move_toward(float(enemy.x),target,enemy.speed*(1.15 if enemy.blood_boost>0 else 1.0)*1.25*dt)
            if distance<52+melee.reach or enemy.windup>0:
                enemy.windup+=dt
                if enemy.windup<=dt:
                    enemy.attack_dir=side
                var tell:float=melee.tell
                if enemy.windup>=tell:
                    enemy.state="contact";enemy.t=0.10;enemy.attack_flash=0.10
                    enemy.strikes+=1
                    _fx(maxi(0,life-1),Vector2(enemy.x+enemy.attack_dir*melee.reach*0.50,FLOOR-enemy.y-40),110+melee.reach,0.22,"visitor",int(enemy.attack_dir))
                    audio.sfx(_weapon_sound())
                    if absf(enemy.x-boss.x)<52+melee.reach+20 and (boss.x-enemy.x)*enemy.attack_dir>-16 and absf(enemy.y-boss.y)<melee.height:
                        _hurt_boss(enemy.damage*(0.85 if enemy.combo_index>0 else 1.0)*(1.25 if enemy.blood_boost>0 else 1.0),false,melee)
                    enemy.windup=0.0
    if enemy.state=="contact":
        enemy.t-=dt
        if enemy.t<=0:
            enemy.chain_left=maxi(0,int(enemy.chain_left)-1)
            enemy.combo_index=enemy.combo_index+1 if enemy.chain_left>0 else 0
            enemy.state="backoff";enemy.t=Rules.RECOVERY[life]
            enemy.decision=0.0 if enemy.chain_left>0 else 0.22
            if enemy.chain_left<=0 and enemy.guard>0.25:
                enemy.guard_t=0.28+float(life%3)*0.08
                enemy.guard_facing=signf(boss.x-enemy.x)

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
    enemy.ability_cd=Rules.ABILITY_CD[life]+1.0
    powers.cast(false)

func _weapon_sound() -> String:
    return "chain" if life==2 else "wood" if life==0 else "ice" if life==7 else "magic" if life==4 else "sword"

func _hurt_boss(damage:float,low:bool,weapon:Dictionary={}) -> void:
    if boss.invuln>0 or boss.transition>0:return
    if low and boss.y>34:return
    var guarded:bool=boss.guarding and not low
    if guarded and boss.guard_age<=0.12 and not boss.guard_perfect_used:
        boss.guard_perfect_used=true
        boss.perfect_blocks+=1
        boss.blocks+=1
        boss.guard=minf(boss.guard_max,boss.guard+0.16)
        boss.guard_exhausted=false
        boss.counter_window=0.75
        boss.invuln=0.16
        enemy.state="parried";enemy.t=0.42
        powers.dispel()
        enemy.poise=maxf(1,enemy.poise-enemy.poise_max*0.55)
        enemy.windup=0.0;enemy.ability_t=0.0
        enemy.knock=signf(enemy.x-boss.x)*160
        _fx(3,Vector2(boss.x,FLOOR-boss.y-60),190,0.36,"royal")
        audio.pulse("perfect")
        hitstop=0.07
        return
    if guarded and boss.guard_exhausted:
        _guard_break(damage)
        return
    if guarded:
        damage*=0.22
        boss.blocks+=1
        boss.guard=maxf(0,boss.guard-0.16-float(weapon.get("guard",0)))
        if boss.guard<=0:boss.guard_exhausted=true;boss.regen_delay=0.65
        audio.sfx("guard")
        _fx(3,Vector2(boss.x,FLOOR-boss.y-60),160,0.27,"royal")
    else:
        audio.sfx("hit")
        _blood(Vector2(boss.x,FLOOR-boss.y-66))
        if not move.is_empty() and move.stage=="tell":
            move.clear()
            boss.combo_queue=0
            boss.cancels+=1
    boss.hp-=damage
    boss.flash=0.14;boss.invuln=0.28
    boss.knock=signf(boss.x-enemy.x)*float(weapon.get("impulse",240))*(0.25 if guarded else 1.0)
    if not guarded and float(weapon.get("lift",0))>0:
        boss.vy=float(weapon.lift);boss.grounded=false
    hitstop=0.032
    if not boss.phase_triggered and boss.hp<=350 and boss.hp>0:_begin_crown_stance()

func _begin_crown_stance() -> void:
    if boss.get("phase_triggered",false):return
    boss.phase_triggered=true
    phase_started=combat_clock
    boss.guard_broken=0.0;boss.guard_exhausted=false
    boss.guard=maxf(boss.guard,boss.guard_max*0.45)
    boss.transition=1.8
    boss.invuln=1.8
    boss.y=0.0;boss.vy=0.0;boss.grounded=true
    move.clear()
    for p in projectiles:
        if is_instance_valid(p.sprite):p.sprite.queue_free()
    projectiles.clear()
    _fx(4,Vector2(boss.x,FLOOR-75),350,1.6,"nova")
    audio.pulse("phase-change")

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
    var frame=int(elapsed*(8 if phase==2 else 5))%(12 if phase==2 else 6)
    if mode=="arrival":
        var t=clampf(mode_t/1.3,0,1)
        king.position=Vector2(lerpf(THRONE.x,boss.x,t),lerpf(THRONE.y,FLOOR-boss.y,t))
        if t<1:motion="rise";frame=mini(5,int(t*6))
    else:
        king.position=Vector2(roundf(boss.x),roundf(FLOOR-boss.y))
        if boss.dash>0:motion="dash";frame=mini(11 if phase==2 else 5,int((1-boss.dash/0.18)*(12 if phase==2 else 6)))
        elif phase==1 and not boss.grounded:motion="jump";frame=1 if boss.vy>180 else 3 if boss.vy> -180 else 5
        elif absf(boss.vx)>20:motion="run";frame=int(boss.stride/8.0)%12
        if not move.is_empty():
            motion="throw" if move.get("counter",false) else "combo_"+str(move.combo) if move.id=="cleave" else move.id
            var duration:float=move.spec[move.stage]
            if move.stage=="tell":
                motion="prepare_throw" if move.get("counter",false) else "prepare_"+("cleave_"+str(move.combo) if move.id=="cleave" else move.id)
                frame=mini(5,int(move.t/maxf(0.01,duration)*6))
            elif move.stage=="active":
                frame=mini(7,5+int(move.t/maxf(0.01,duration)*3)) if phase==1 and move.id in ["cleave","throw"] else mini(4,2+int(move.t/maxf(0.01,duration)*3))
            else:
                frame=mini(11,8+int(move.t/maxf(0.01,duration)*4)) if phase==1 and move.id in ["cleave","throw"] else 4 if move.t<duration*0.65 else 5
        if boss.land>0 and move.is_empty():motion="land";frame=clampi(int((1-boss.land/0.18)*6),0,5)
        if boss.guard_broken>0:motion="hurt";frame=clampi(int((1-boss.guard_broken/1.1)*6),0,5)
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
    if enemy.state=="enter" or enemy.state=="attack" and enemy.windup<=0 and absf(enemy.x-boss.x)>52+Rules.MELEE[life].reach:
        em="walk";ef=int(enemy.stride/7.0)%12
    if enemy.state in ["dash","evade"]:em="dash";ef=int(elapsed*22)%6
    if enemy.y>2:em="jump";ef=1 if enemy.vy>150 else 4
    if enemy.windup>0:em="prepare";ef=mini(5,int(enemy.windup/Rules.MELEE[life].tell*6))
    if enemy.ability_t>0:em="prepare";ef=mini(5,int((1-enemy.ability_t/Rules.ABILITY_TELL[life])*6))
    elif enemy.attack_flash>0:em="cleave";ef=3+mini(2,int((1-enemy.attack_flash/0.18)*3))
    if enemy.state in ["hurt","parried"]:em="hurt";ef=mini(5,int((0.48-enemy.t)/0.48*6))
    elif enemy.state=="backoff":em="cleave";ef=4 if enemy.t>Rules.RECOVERY[life]*0.28 else 5
    if powers.busy():
        em=enemy.get("power_motion","prepare");ef=enemy.get("power_frame",0)
    visitor.position=Vector2(roundf(enemy.x),roundf(FLOOR-enemy.y))
    var enemy_facing:int=1 if boss.x>enemy.x else -1
    if enemy.windup>0 or enemy.state in ["contact","backoff"]:enemy_facing=int(enemy.attack_dir)
    elif enemy.ability_t>0:enemy_facing=1 if enemy.ability_target.x>enemy.x else -1
    elif enemy.state=="dash":enemy_facing=int(enemy.dash_dir)
    visitor.pose(em,ef,enemy_facing,61 if life==0 else 85 if life==8 else 78)
    visitor.rotation=deg_to_rad(float(enemy.combo_index)*-7.0) if enemy.attack_flash>0 else 0.0
    visitor.modulate=Color("#ffb3ab") if enemy.flash>0 else Color.WHITE
    king_shadow.position=Vector2(roundf(boss.x),FLOOR+2)
    king_shadow.scale=Vector2(maxf(0.40,1-boss.y/280.0),1)
    king_shadow.modulate.a=0.65 if phase==2 else 0.42
    king_shadow.visible=mode in ["fight","arrival"]
    visitor_shadow.position=Vector2(roundf(enemy.x),FLOOR+2)
    visitor_shadow.scale=Vector2(maxf(0.4,1-enemy.y/250.0),1)
    visitor_shadow.visible=mode in ["fight","arrival"]
    ward.visible=boss.guarding and mode=="fight"
    ward.texture=Actor.guard_texture("king",int(elapsed*10)%6,phase)
    ward.position=Vector2(roundf(boss.x),roundf(FLOOR-boss.y-76))
    ward.scale=Vector2.ONE
    ward.modulate=Color("#ff9f89") if boss.guard_exhausted else Color("#ffe6a3") if phase==1 else Color("#abebff")
    enemy_ward.visible=enemy.guard_t>0 and enemy.guard>0.05
    enemy_ward.texture=Actor.guard_texture(Rules.LIVES[life],int(elapsed*10)%6,1)
    enemy_ward.position=Vector2(roundf(enemy.x),roundf(FLOOR-enemy.y-38))
    enemy_ward.scale=Vector2.ONE
    enemy_ward.modulate=Color(1,1,1,0.3+0.7*enemy.guard)
    enemy_ward.flip_h=enemy.guard_facing<0
    _draw_telegraphs()

func _hud() -> void:
    if mode not in ["fight","arrival","paused"]:return
    var names:Array=[]
    for key in ["cleave","throw","reap","nova"]:names.append(Rules.move_spec(key,phase).name)
    ui.set_hud({"player_hp":boss.hp,"player_max":boss.max,"enemy_hp":enemy.hp,"enemy_max":enemy.max,
        "enemy_name":"???","year":Rules.YEARS[fight_index],"phase":phase,"guard":boss.guard,
        "cooldowns":boss.cooldowns,"move_names":names,"guard_max":boss.guard_max,"guard_break":boss.guard_broken,"vow":boss.vow,
        "current_power":powers.debug_state().power,"enemy_ultimate":powers.debug_state().ultimate if powers.debug_state().casting_ultimate else "",
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
    for marker in tell_markers:
        if is_instance_valid(marker):marker.visible=false
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
    king_shadow.visible=false;visitor_shadow.visible=false
    audio.music("years")
    audio.set_tension(0.0)
    var old_year:int=Rules.YEARS[fight_index]
    fight_index+=1
    message.text=str(Rules.YEARS[fight_index]-old_year)+" years."+"\n"+["The stores remain sealed.","The lower bridge falls.","No physician reaches the ward.","The scaffolds rot.","Petitions gather dust.","The gate is never repaired.","Names vanish from the census.","The bell has no keeper."][fight_index-1]
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
    king_shadow.visible=false;visitor_shadow.visible=false
    _save_run()
    ui.hide_hud()
    _clear_effects()
    powers.dispel()
    ward.visible=false;enemy_ward.visible=false
    boss.guarding=false
    king.visible=true;visitor.visible=true
    king.position=Vector2(755,FLOOR-boss.y if phase==2 else FLOOR)
    if phase==2:create_tween().tween_property(king,"position:y",FLOOR,0.50)
    visitor.position=Vector2(570,FLOOR)
    king.pose("idle",0,-1,143)
    visitor.pose("idle",0,1,100)
    audio.music("finale")
    audio.set_tension(0.15)
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
        await ui.speak("THE IMMORTAL","Every life was mine. I have silenced them all.","king",2.8)
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
        await ui.speak("THE IMMORTAL","Morrow. My name was Morrow.","king",2.4)
        if token!=epoch:return
        stage="memory-reveal"
        await ui.speak("MORROW","The bell. The rain. The sea. Those lives were mine.","king",2.8)
        if token!=epoch:return
        stage="spirits"
        await _release_memories()
        if token!=epoch:return
        await _pause(1.6)
        if token!=epoch:return
        await ui.speak("MORROW","No more kings.","king",2.0)
        if token!=epoch:return
        stage="decree"
        audio.set_tension(1.0)
        for n in range(6,10):
            finisher.texture=Actor.finisher_texture(n)
            _blood(Vector2(752,FLOOR-82))
            _fx(4,Vector2(752,FLOOR-80),120+(n-6)*45,0.65,"nova")
            await _pause(0.27)
            if token!=epoch:return
        stage="explosion"
        finisher.texture=Actor.finisher_texture(10)
        audio.pulse("climax")
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
        "combo":boss.get("combo",0),"combo_history":boss.get("combo_history",[]),"active_move":move.get("id",""),"move_stage":move.get("stage",""),"player_move_stage":move.get("stage",""),
        "enemy_state":enemy.get("state",""),"enemy_dashes":enemy.get("dashes",0),"enemy_strikes":enemy.get("strikes",0),"enemy_abilities":enemy.get("abilities",0),
        "enemy_x":enemy.get("x",0),"enemy_max":enemy.get("max",0),"enemy_guard":enemy.get("guard",1),"poise":enemy.get("poise",0),"poise_breaks":enemy.get("poise_breaks",0),
        "perfect_blocks":boss.get("perfect_blocks",0),"guard_age":boss.get("guard_age",99),"counter_ready":boss.get("counter_window",0)>0,"counter_hits":boss.get("counter_hits",0),"cancels":boss.get("cancels",0),
        "enemy_attack_in":maxf(0,Rules.MELEE[life].tell-float(enemy.get("windup",0))) if enemy.get("windup",0)>0 else -1,
        "dialogue_text":ui.get("dialogue_text"),"spirits_released":spirits_released,"telegraphs":_telegraph_data(),
        "vx":boss.get("vx",0),"vy":boss.get("vy",0),"grounded":boss.get("grounded",true),"king_sprite_path":king.sprite.texture.atlas.resource_path if king.sprite.texture is AtlasTexture else "",
        "player_steps":boss.get("steps",0),"enemy_steps":enemy.get("steps",0),"king_actor":king.who,
        "enemy_render_x":visitor.position.x,"enemy_render_y":visitor.position.y,"actor_render_y":king.position.y,
        "actor_motion":king.current_motion,"actor_frame":king.current_frame,"enemy_motion":visitor.current_motion,"enemy_frame":visitor.current_frame,
        "actor_region":str(king.sprite.texture.region) if king.sprite.texture is AtlasTexture else "",
        "enemy_region":str(visitor.sprite.texture.region) if visitor.sprite.texture is AtlasTexture else "",
        "enemy_sprite_path":visitor.sprite.texture.atlas.resource_path if visitor.sprite.texture is AtlasTexture else "",
        "waiting_pose":"rest" if mode=="waiting" and absf(king.position.x-THRONE.x)<2 else "",
        "music":audio.get("current_cue"),
        "guard":boss.get("guard",1),"max_guard":boss.get("guard_max",1),"guard_exhausted":boss.get("guard_exhausted",false),
        "guard_broken":boss.get("guard_broken",0),"guard_breaks":boss.get("guard_breaks",0),"regen_delay":boss.get("regen_delay",0),
        "action_locked":boss.get("guard_broken",0)>0.45 or boss.get("land",0)>0.065,"vow":boss.get("vow",false),
        "hovering":phase==2 and mode=="fight","hover_height":56 if phase==2 else 0,"shadow_visible":king_shadow.visible,
        "land_timer":boss.get("land",0),"power":powers.debug_state(),"entrance":entrances.debug_state(),
        "power_count":enemy.get("power_count",0),"ultimate_count":enemy.get("ultimate_count",0),"cost_paid":enemy.get("cost_paid",0)}
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
func _release_memories() -> void:
    # Recognizable coats and accessories leave the king, rather than unrelated particles.
    for index in range(9):
        var spirit=Sprite2D.new()
        var texture:AtlasTexture=Actor.texture_for(Rules.LIVES[index],"idle",0)
        spirit.texture=texture
        spirit.texture_filter=CanvasItem.TEXTURE_FILTER_NEAREST
        spirit.position=Vector2(752,FLOOR-76)
        spirit.modulate=Color(0.60,0.94,1.0,0.70)
        spirit.z_index=18
        add_child(spirit)
        var angle:float=-PI+0.22+float(index)*0.34
        effects.append({"sprite":spirit,"t":0.0,"duration":3.5,"row":-1,"kind":"","alpha":0.70,"velocity":Vector2(cos(angle)*95,-70-absf(sin(angle))*85)})
        spirits_released+=1
        audio.sfx("magic")
        await _pause(0.16)

func _telegraph_data() -> Array:
    var entries:Array=[]
    if mode!="fight":return entries
    if not move.is_empty() and move.stage=="tell":
        var ratio:float=clampf(move.t/move.spec.tell,0,1)
        if move.id=="reap":
            var marks:Array=move.marks if phase==2 else [move.target]
            for x in marks:entries.append({"kind":"royal","x":float(x),"y":FLOOR-3,"width":128.0 if phase==2 else 176.0,"progress":ratio,"enemy":false,"remaining":move.spec.tell-move.t})
        elif move.id=="throw" and phase==2:
            for lane in range(-2,3):entries.append({"kind":"landing","x":move.target+lane*60,"y":FLOOR-3,"width":46.0,"progress":ratio,"enemy":false,"remaining":move.spec.tell-move.t})
        elif move.id=="nova":
            for x in (move.marks if phase==1 else [boss.x-250,boss.x,boss.x+250]):
                entries.append({"kind":"nova","x":float(x),"y":FLOOR-3,"width":170.0,"progress":ratio,"enemy":false,"remaining":move.spec.tell-move.t})
    if enemy.ability_t>0 and life in [0,5,7]:
        entries.append({"kind":"landing","x":enemy.ability_target.x,"y":FLOOR-3,"width":90.0,"progress":1-enemy.ability_t/Rules.ABILITY_TELL[life],"enemy":true,"remaining":enemy.ability_t})
    return entries

func _draw_telegraphs() -> void:
    var data:Array=_telegraph_data()
    while tell_markers.size()<data.size():
        var marker=Sprite2D.new()
        marker.texture_filter=CanvasItem.TEXTURE_FILTER_NEAREST
        marker.z_index=6
        add_child(marker)
        tell_markers.append(marker)
    for n in range(tell_markers.size()):
        var marker:Sprite2D=tell_markers[n]
        marker.visible=n<data.size()
        if not marker.visible:continue
        var d:Dictionary=data[n]
        marker.texture=Actor.tell_texture(d.kind,mini(5,int(d.progress*6)))
        marker.position=Vector2(roundf(d.x),roundf(d.y))
        marker.scale=Vector2(roundf(d.width/128.0*2)/2.0,0.20)
        marker.modulate=Rules.COLORS[life] if d.enemy else Color("#8febff") if phase==2 else Color("#ffdc8f")
        marker.modulate.a=0.22+0.18*d.progress

func _ground_shadow(radius:float) -> Sprite2D:
    var shadow=Sprite2D.new()
    var width:int=int(radius*2)
    var image=Image.create(width,8,false,Image.FORMAT_RGBA8)
    image.fill(Color.TRANSPARENT)
    for y in range(8):
        for x in range(width):
            var nx:float=(float(x)-radius)/radius
            var ny:float=(float(y)-3.5)/4.0
            var distance:float=nx*nx+ny*ny
            if distance<=1.0:image.set_pixel(x,y,Color(0.02,0.03,0.05,0.48 if distance>0.7 else 0.75))
    shadow.texture=ImageTexture.create_from_image(image)
    shadow.texture_filter=CanvasItem.TEXTURE_FILTER_NEAREST
    shadow.z_index=5
    add_child(shadow)
    return shadow
