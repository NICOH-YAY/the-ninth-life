# AI-use disclosure: Codex-authored classic sword/AoE restoration and retained weighted-combat regressions.
extends SceneTree
var game
var checks:int=0
var failures:Array[String]=[]
func _initialize()->void:call_deferred("_run")
func check(value:bool,why:String)->void:
    checks+=1
    if not value:failures.append(why);push_error(why)
func fixture(index:int=0,stance:int=1)->void:
    game.life=index;game.fight_index=index;game._reset_bodies();game.mode="fight";game.phase=stance
    game.boss.x=520.0;game.boss.facing=1;game.boss.y=56.0 if stance==2 else 0.0
    game.enemy.x=600.0;game.enemy.hp=1000.0;game.enemy.max=1000.0
    game.enemy.state="wait";game.enemy.decision=100;game.enemy.ability_cd=100;game.enemy.mobility_cd=100
    game.powers._used_ultimate=true
func blank()->Dictionary:return {"left":false,"right":false,"jump":false,"jump_held":false,"dash":false,"guard":false,"hold":false,"cleave":false,"cleave_taps":0,"throw":false,"reap":false,"nova":false}
func active(id:String)->void:
    game._start_move(id);game.move.stage="active";game.move.t=0.0
func contact(id:String)->void:active(id);game._active_hit()
func exhaust_active()->void:
    var duration:float=game.move.spec.active
    for n in range(ceili(duration/0.01)+1):
        game.enemy.invuln=maxf(0,game.enemy.invuln-0.01);game.move.t=minf(duration,n*0.01);game._active_hit()
func classic_cases()->void:
    check(not ResourceLoader.exists("res://royal_magic.gd"),"The reverted Pressure module is absent from the active Godot project, not silently exported as dead code.")
    check(game.get("magic")==null,"RoyalMagic must not be active after the requested classic-kit restoration.")
    for stance in [1,2]:
        for id in ["cleave","throw","reap","nova"]:
            fixture(0,stance);game.boss.guard=0.0;game._start_move(id)
            check(not game.move.is_empty() and game.move_counts[id]==1,"Classic %s phase%d casts with cooldowns, without a Pressure gate."%[id,stance])
    for stance in [1,2]:
        fixture(0,stance)
        for combo in range(3):
            game.enemy.invuln=0;game.boss.cooldowns.cleave=0;contact("cleave")
        check(game.boss.combo_history==[0,1,2] and game.enemy.hp<1000,"Both sword forms retain three distinct actual contact combo stages.")
    fixture();var start:float=game.boss.x;game._start_move("throw")
    for n in range(100):game._player_step(blank(),0.01);game._move_step(0.01)
    check(game.boss.x>start+1 and game.enemy.hp<1000 and game.projectiles.is_empty(),"Oathpiercer is a physical sword lunge with real damage, not an old-body echo.")
    fixture();game.enemy.poise=1;contact("reap")
    check(game.enemy.hp<1000 and game.enemy.kneel>0 and game.enemy.y==0 and game.enemy.vy==0,"Kneel hits its locked ground position and physically forces a posture-broken visitor down.")
    fixture();game.enemy.x=930;active("nova");exhaust_active()
    check(game.move.spawned==3 and game.enemy.hp<1000,"Procession reaches all three advancing marks and can strike410pixels away.")
    fixture(0,2);game.enemy.x=700;active("throw");exhaust_active()
    check(game.projectiles.size()==5,"Crownfall creates five separate actual descending crown blades.")
    for n in range(100):game.enemy.invuln=maxf(0,game.enemy.invuln-0.01);game._projectile_step(0.01)
    check(game.enemy.hp<1000,"A descending Crownfall blade reaches actual enemy collision and damage.")
    fixture(0,2);game.enemy.x=780;contact("reap")
    check(game.enemy.hp<1000 and game.enemy.knock<0 and game.enemy.vy==260,"Royal Undertow damages, pulls inward and lifts through its actual AoE contact.")
    fixture(0,2);game.enemy.x=930;active("nova");exhaust_active()
    check(game.move.hit and game.enemy.hp<1000,"Last Dominion expands to its actual outer radius and hits once.")
    fixture();game._hud()
    var labels=game.ui.get("_hud").find_children("*","Label",true,false)
    var absent=true
    for label in labels:
        if label.is_visible_in_tree() and ("PRESSURE" in label.text or "WARD EXPOSED" in label.text):absent=false
    check(absent,"The classic HUD contains no active Pressure meter or Ransom ward-exposure label.")
func rebuke_cases()->void:
    for index in [2,5,7,8]:
        fixture(index);game.enemy.guard_t=3.0;game.enemy.guard_facing=-1;game.enemy.poise=1000;game.enemy.poise_max=1000
        game._hit_enemy(20,"cleave")
        check(game.enemy.state=="rebuke" and game.enemy.windup>0 and game.enemy.rebuke_cd>0,"Frontal guard contact starts a real body counter for visitor%d."%index)
        game._animate()
        check(game.visitor.current_motion=="prepare","The counter exposes an actual bodily anticipation, not an invisible damage timer.")
        var tell:float=game.enemy.windup;var count:int=game.enemy.rebukes
        game.enemy.invuln=0;game._hit_enemy(2,"cleave")
        check(game.enemy.rebukes==count and game.enemy.windup==tell,"Repeated basic contacts cannot reset or extend the latched counter tell.")
        var hp:float=game.boss.hp
        for n in range(ceili(float(game.enemy.rebuke_tell)/0.01)+3):game._enemy_step(0.01)
        check(game.boss.hp<hp and game.enemy.strikes==1,"The guarded counter reaches real collision and damage instead of merely flashing.")
    fixture(5);game.enemy.guard_t=3.0;game.enemy.guard_facing=-1;game.boss.x=680
    game._hit_enemy(20,"cleave")
    check(game.enemy.state!="rebuke" and game.enemy.hp==980,"A genuine rear hit bypasses frontal guard without a compulsory counter.")
    fixture(5);game.enemy.guard_t=3.0;game.boss.guarding=true;game.boss.guard_age=0.01
    game._hurt_boss(20,false,{})
    check(game.enemy.state=="parried" and game.enemy.guard_t==0,"A timed parry opens the enemy shield for a real riposte.")
func readable_counter_case()->void:
    for combo in range(3):
        fixture(5);game.enemy.guard_t=3.0;game.enemy.guard_facing=-1;game.boss.facing=1;game.boss.combo=combo-1;game.boss.combo_until=100.0
        game._start_move("cleave")
        var committed=false;var defended=false;var recovered=false
        for n in range(130):
            game.enemy.invuln=maxf(0,game.enemy.invuln-0.01);game.boss.invuln=maxf(0,game.boss.invuln-0.01)
            var press=false
            if game.enemy.state=="rebuke":
                committed=true
                if game.move.is_empty():recovered=true
                press=game.move.is_empty() and float(game.enemy.rebuke_tell)-game.enemy.windup<=0.085
            var keys={"left":false,"right":false,"jump":false,"jump_held":false,"dash":false,"guard":press,"hold":false,"cleave":false,"cleave_taps":0,"throw":false,"reap":false,"nova":false}
            game._player_step(keys,0.01);game._move_step(0.01);game._enemy_step(0.01)
            if game.boss.perfect_blocks>0:defended=true;break
        check(committed and recovered,"A real blocked main sword slash finishes its full recovery before the visible counter lands.")
        check(defended and game.boss.hp==game.boss.max,"A real fresh G after sword recovery can parry the committed body counter without pre-canceling the original strike.")
func spacing_cases()->void:
    var keys={"left":false,"right":true,"jump":false,"jump_held":false,"dash":false,"guard":false,"hold":false,"cleave":false,"cleave_taps":0,"throw":false,"reap":false,"nova":false}
    fixture(5);var stayed_front=true
    for n in range(100):
        game._player_step(keys,1.0/60.0)
        if game.boss.x>game.enemy.x:stayed_front=false
    check(stayed_front and game.enemy.x-game.boss.x>=43.99,"One hundred real walking inputs cannot automatically cross a grounded guard body.")
    fixture(5);game.boss.x=560;keys.dash=true
    for n in range(15):game._player_step(keys,1.0/60.0);keys.dash=false
    check(game.boss.x>game.enemy.x and game.boss.dashes==1,"A real dash deliberately crosses the body that ordinary walking cannot pass.")
    fixture(5);game.boss.x=540;keys.jump=true;keys.jump_held=true
    var crossed_above=false
    for n in range(90):
        game._player_step(keys,1.0/60.0);keys.jump=false
        if game.boss.x>game.enemy.x and game.boss.y>=game.Actor.body_height("knight")-10:crossed_above=true
    check(crossed_above and game.boss.x>game.enemy.x,"A real jump can clear the solid lower body and land on the other side.")
    fixture(5);game.boss.x=560;game.boss.facing=1;game._start_move("throw")
    for n in range(100):game._player_step(blank(),0.01);game._move_step(0.01)
    check(game.boss.x>game.enemy.x,"The restored physical base thrust can pass through the pushbox for its original lunge flow.")
    fixture(5);game.boss.x=912;game.enemy.x=930;game._body_spacing()
    check(is_finite(game.boss.x) and is_finite(game.enemy.x) and game.boss.x>=48 and game.boss.x<=912 and game.enemy.x-game.boss.x>=43.99,"Mass separation stays finite and non-overlapping against the right arena wall.")
    game.boss.x=48;game.enemy.x=30;game._body_spacing()
    check(is_finite(game.boss.x) and is_finite(game.enemy.x) and game.boss.x-game.enemy.x>=43.99,"Mass separation also resolves overlap against the opposite wall.")
func _run()->void:
    game=load("res://game.gd").new();root.add_child(game);await process_frame;game.set_physics_process(false)
    classic_cases();rebuke_cases();readable_counter_case();spacing_cases()
    game.powers.dispel();game.entrances.clear();game._clear_effects();game.ui.reset();game.audio.stop_all();game.Actor._cache.clear();game.Actor._images.clear()
    await create_timer(0.25).timeout;game.queue_free();await process_frame;await process_frame;await create_timer(0.15).timeout
    print(JSON.stringify({"ok":failures.is_empty(),"checks":checks,"failures":failures}));quit(0 if failures.is_empty() else 1)
