# AI-use disclosure: Codex-authored behavioral verification of guard, hover and nine sacrificial power lifecycles.
extends SceneTree
var game
var checks: int = 0
var failures: Array[String] = []
var power_results: Array[Dictionary] = []
func _initialize() -> void:
    call_deferred("_run")
func check(value: bool, why: String) -> void:
    checks += 1
    if not value:
        failures.append(why)
        push_error(why)
func input() -> Dictionary:
    return {"left":false,"right":false,"jump":false,"jump_held":true,"dash":false,"guard":false,"hold":false,"cleave":false,"cleave_taps":0,"throw":false,"reap":false,"nova":false}
func fixture(index: int = 0) -> void:
    game.life=index;game.fight_index=index;game._reset_bodies();game.mode="fight"
    game.enemy.state="wait";game.enemy.x=400.0;game.boss.x=600.0
    game.enemy.decision=100.0;game.enemy.ability_cd=100.0;game.enemy.mobility_cd=100.0
func step_player(i: Dictionary, count: int) -> void:
    for n in range(count):
        game.boss.invuln=maxf(0,game.boss.invuln-1.0/60.0)
        game._player_step(i,1.0/60.0)
func guard_cases() -> void:
    fixture()
    var held: Dictionary=input();held.guard=true
    step_player(held,230)
    check(game.boss.guard==0 and game.boss.guarding and game.boss.guard_exhausted,"Holding guard must leave an empty raised shield latched without free regeneration.")
    check(game.boss.guard_breaks==0,"Emptying guard alone must not break it before the next contact.")
    var hp: float=game.boss.hp
    game._hurt_boss(20,false,{})
    check(game.boss.guard_breaks==1 and is_equal_approx(game.boss.guard_broken,1.1),"The next exhausted ordinary shield contact must cause exactly one1.1s break.")
    check(is_equal_approx(game.boss.hp,hp-20) and absf(game.boss.knock)>=450,"Guard break must take full damage and strong physical knockback.")
    var attacking: Dictionary=input();attacking.guard=true;attacking.cleave=true;attacking.cleave_taps=1
    step_player(attacking,20)
    check(game.move.is_empty() and not game.boss.guarding,"Initial shield-break recovery must reject both attacking and re-guarding.")
    step_player(held,110)
    check(game.boss.guard==0,"Keeping G held after a break must not silently refill guard.")
    step_player(input(),160)
    check(game.boss.guard>0.25 and not game.boss.guard_exhausted,"Releasing guard and waiting its recovery delay must restore shielding.")
    fixture()
    game.boss.guarding=true;game.boss.guard=0.05;game.boss.guard_age=1.0
    game._hurt_boss(20,false,{})
    check(game.boss.guard==0 and game.boss.guard_exhausted and game.boss.guard_breaks==0,"A blocked hit that spends the last guard must not itself be the next-hit break.")
    game.boss.invuln=0;game._hurt_boss(20,false,{})
    check(game.boss.guard_breaks==1,"The subsequent shield hit must break the hit-depleted guard.")
    fixture()
    game.boss.guard=0;game.boss.guard_exhausted=true
    game._player_step(held,1.0/60.0);game._hurt_boss(20,false,{})
    check(game.boss.perfect_blocks==1 and game.boss.guard_breaks==0 and game.boss.guard>0,"An exact fresh parry must deflect the strike and save an exhausted shield.")
    fixture()
    game.boss.guarding=true;game.boss.guard=0;game.boss.guard_exhausted=true;hp=game.boss.hp
    game._hurt_boss(20,true,{})
    check(game.boss.hp==hp-20 and game.boss.guard_breaks==0,"An unblockable low hit damages health but does not contact/break the shield.")
func weight_cases() -> void:
    fixture()
    var leap: Dictionary=input();leap.jump=true
    game._player_step(leap,1.0/60.0)
    for n in range(150):
        game._player_step(input(),1.0/60.0)
        if game.boss.grounded:break
    check(game.boss.grounded and game.boss.land>0.10,"A real landing must create a weighted settling interval.")
    var strike: Dictionary=input();strike.cleave=true;strike.cleave_taps=1
    game._player_step(strike,1.0/60.0)
    check(game.move.is_empty(),"The initial landing settle must not instantly cancel into an attack.")
    fixture()
    game.boss.y=3.0;game.boss.vy=-180.0;game.boss.grounded=false;game.boss.coyote=0
    leap=input();leap.jump=true;game._player_step(leap,1.0/60.0)
    check(game.boss.grounded and game.boss.land>0.10 and game.boss.jumps==0,"A buffered touchdown jump must respect the landing settle.")
    step_player(input(),11)
    check(game.boss.jumps==1 and game.boss.y>0 and not game.boss.grounded,"A jump buffered just before touchdown must fire after the settle rather than expire.")
    fixture()
    game.phase=2
    var glide: Dictionary=input();glide.right=true
    step_player(glide,120)
    check(is_equal_approx(game.boss.y,56.0) and not game.boss.grounded,"Ascended levitation must exist in logical physics at56px, not just sprite offsets.")
    check(game.boss.steps==0,"Gliding must not emit grounded footstep contacts.")
    game._animate()
    check(is_equal_approx(game.king.position.y,game.FLOOR-game.boss.y) and game.king_shadow.visible,"The floating body and ground shadow must agree with logical hover height.")
    leap=input();leap.jump=true;game._player_step(leap,1.0/60.0)
    check(game.boss.y>56 and game.boss.jumps==1,"A jump from the hover plane must still have real extra height.")
    step_player(input(),150)
    check(is_equal_approx(game.boss.y,56.0) and game.boss.steps==0,"The ascended body must settle back onto hover height without floor contacts.")
func power_case(index: int, ultimate: bool, probe_contact: bool) -> Dictionary:
    fixture(index)
    if ultimate:game.enemy.hp=game.enemy.max*0.55
    var start_hp: float=game.enemy.hp
    var boss_hp: float=game.boss.hp
    check(game.powers.cast(ultimate),"Life"+str(index)+" must begin its requested real power.")
    var initial: Dictionary=game.powers.debug_state()
    var kinds: Dictionary={}
    for h in initial.hazards:kinds[h.kind]=true
    if index==2:
        var crushes: int=0
        for h in initial.hazards:
            if h.kind=="burden-crush":
                crushes+=1
                if ultimate:check(h.get("drowned",false) and h.body_visible,"The drowned ultimate must have an actual falling cat body.")
        check(crushes==(3 if ultimate else 1),"The sailors ultimate must change one locked slam into three distinct landing lanes.")
    if index==4:check(initial.auxiliary,"Shared Wound must summon a real grave-knight sprite, not a projectile recolor.")
    if index==6:
        var real_bodies: int=0
        for h in initial.hazards:
            if h.real:real_bodies+=1;check(h.lunge,"The damaging remembered body must perform an actual physical lunge.")
        check(real_bodies==1 and initial.hazards.size()==(3 if ultimate else 1),"Thief ultimate must add harmless historical echoes around exactly one real body.")
    if index==8:
        var actors: Dictionary={}
        for h in initial.hazards:
            actors[h.memory_actor]=true
            check(h.body_visible and not str(h.memory_actor).is_empty(),"Patchwork must call actual remembered cat bodies.")
        check(actors.size()==(3 if ultimate else 2),"The last life must sequence distinct remembered identities.")
    var active_seen: bool=false
    var recovery_seen: bool=false
    var maximum_y: float=0
    var maximum_x: float=game.enemy.x
    var minimum_x: float=game.enemy.x
    var recovery_start: float=-1
    var elapsed: float=0
    var interleaved: bool=false
    for n in range(650):
        var debug: Dictionary=game.powers.debug_state()
        if probe_contact:
            for h in debug.hazards:
                if h.real and (h.active or h.tell<=0.035):
                    game.boss.x=h.x;game.boss.y=h.y;break
        else:
            game.boss.x=950;game.boss.y=400
        game.boss.invuln=maxf(0,game.boss.invuln-0.02)
        game.powers.tick(0.02)
        elapsed+=0.02
        debug=game.powers.debug_state()
        active_seen=active_seen or game.enemy.state=="power_active"
        if debug.recovering and recovery_start<0:recovery_start=elapsed
        recovery_seen=recovery_seen or debug.recovering
        maximum_y=maxf(maximum_y,game.enemy.y)
        maximum_x=maxf(maximum_x,game.enemy.x);minimum_x=minf(minimum_x,game.enemy.x)
        if game.powers.busy():
            game._enemy_step(0.02)
            interleaved=interleaved or game.enemy.strikes>0
        if not game.powers.busy():break
    check(not interleaved,"Power commitment must not interleave ordinary weapon strikes.")
    var expected: float=game.enemy.max*(0.045 if ultimate else 0.018)
    check(active_seen and recovery_seen and not game.powers.busy(),"Every innate/ultimate must finish active danger and bounded recovery.")
    check(is_equal_approx(start_hp-game.enemy.hp,expected) and game.enemy.cost_paid>0,"Every real cast must pay its own nonlethal health sacrifice.")
    check(recovery_start>=0 and elapsed-recovery_start>=1.05,"A paid power must leave at least a meaningful one-second recovery opening.")
    check((game.boss.hp<boss_hp) if probe_contact else is_equal_approx(game.boss.hp,boss_hp),"Real hazard contact must hurt; moving outside the full hurt bounds must avoid it.")
    if ultimate:check(not game.powers.can_ultimate() and not game.powers.cast(true),"An ultimate must not repeat during the same life.")
    if index==6:check(maximum_x-minimum_x>60,"The real historical body must physically cross the locked target lane.")
    if index==8:check(game.boss.bound>0 if probe_contact else game.boss.bound==0,"The first memory must apply its binding status only on real contact.")
    if index==3:check(maximum_y>=120,"Stored Fall must physically lift and dive the enemy body.")
    if index==5:check(game.enemy.blood_boost>0 and game.powers.debug_state().blood_aura,"Blood sacrifice must leave a real timed boost and aura after recovery.")
    return {"life":index,"ultimate":ultimate,"contact":probe_contact,"power":initial.power,"ultimate_name":initial.ultimate,"hazard_kinds":kinds.keys(),"recovery":elapsed-recovery_start,"cost":start_hp-game.enemy.hp,"body_y":maximum_y,"body_travel":maximum_x-minimum_x}
func hover_hurtbox_cases() -> void:
    fixture(7)
    game.phase=2;game.boss.y=56.0;game.boss.grounded=false
    game.powers.cast(false)
    for n in range(53):game.powers.tick(0.02)
    check(is_equal_approx(game.boss.hp,700.0),"A low silence wave must pass beneath logical hover height.")
    for n in range(35):game.powers.tick(0.02)
    check(game.boss.hp<700,"The high silence beam must intersect the floating kings actual torso.")
    fixture(7)
    game.powers.cast(false);game.boss.x=950;game.boss.y=0
    for n in range(53):game.powers.tick(0.02)
    game.boss.x=600
    for n in range(35):game.powers.tick(0.02)
    check(is_equal_approx(game.boss.hp,700.0),"Remaining grounded must avoid the high beam after clearing its low wave.")
func _run() -> void:
    game=load("res://game.gd").new();root.add_child(game);await process_frame;game.set_physics_process(false)
    guard_cases();weight_cases();hover_hurtbox_cases()
    for index in range(9):
        power_results.append(power_case(index,false,true))
        power_results.append(power_case(index,true,true))
        power_results.append(power_case(index,false,false))
    game.powers.dispel();game.entrances.clear();game._clear_effects();game.ui.reset();game.audio.stop_all()
    game.Actor._cache.clear();game.Actor._images.clear()
    await create_timer(0.25).timeout;game.queue_free();await process_frame;await process_frame;await create_timer(0.15).timeout
    print(JSON.stringify({"ok":failures.is_empty(),"checks":checks,"powers":power_results,"failures":failures}))
    quit(0 if failures.is_empty() else 1)
