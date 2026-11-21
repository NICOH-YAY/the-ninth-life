# AI-use disclosure: Codex-authored native behavioral checks for limited, positional royal magic.
extends SceneTree
var game
var checks:int=0
var failures:Array[String]=[]
func _initialize()->void:call_deferred("_run")
func check(value:bool,why:String)->void:
    checks+=1
    if not value:failures.append(why);push_error(why)
func fixture(index:int=0)->void:
    game.life=index;game.fight_index=index;game._reset_bodies();game.mode="fight"
    game.boss.x=520.0;game.enemy.x=600.0;game.enemy.hp=1000.0;game.enemy.max=1000.0
    game.enemy.state="wait";game.enemy.decision=100;game.enemy.ability_cd=100;game.enemy.mobility_cd=100
func contact(id:String)->void:
    game._start_move(id)
    if game.move.is_empty():return
    game.move.stage="active";game.move.t=0.0;game._active_hit()
func tick_magic(seconds:float)->void:
    for n in range(ceili(seconds/0.01)):
        game.boss.invuln=maxf(0,game.boss.invuln-0.01)
        game.enemy.invuln=maxf(0,game.enemy.invuln-0.01)
        game.magic.tick(0.01)
func hazard_interactions()->void:
    fixture(2)
    game.powers.cast(false);game.boss.x=950;game.boss.y=400
    for n in range(140):game.powers.tick(0.01)
    var crest:Dictionary=game.powers._hazards[1]
    var old_origin:float=crest.origin_x;var old_x:float=crest.x
    var changed:int=game.powers.bend_field(old_x+50,120,1,0.20)
    check(changed>0 and crest.origin_x>old_origin and crest.x>old_x,"A field can redirect a currently travelling water crest, not only its preview.")
    game.powers.tick(0.02)
    var expected:float=crest.origin_x+crest.vx*minf(crest.time-crest.tell,crest.travel)
    check(is_equal_approx(crest.x,expected) and is_equal_approx(crest.sprite.position.x,crest.x),"Redirected crest collision and live sprite keep the shifted origin instead of snapping back.")
    fixture(1)
    game.enemy.hp=500;game.powers.cast(true);game.boss.x=950;game.boss.y=400
    for n in range(128):game.powers.tick(0.01)
    var active:Dictionary=game.powers._hazards[0];var pending:Dictionary=game.powers._hazards[1]
    game.boss.x=520;game.boss.y=0;game.enemy.x=900;game.magic.pressure=80
    contact("nova")
    check(not active.real and active.hit and pending.real and not pending.hit,"Ransom disperses only live nearby danger; future queued threats remain real.")
    check(game.powers.busy(),"Dispersing one active lane does not universally cancel the enemy cast.")
    var hp:float=game.boss.hp
    for n in range(60):game.boss.invuln=maxf(0,game.boss.invuln-0.01);game.powers.tick(0.01)
    check(game.boss.hp<hp,"A future queued lane can still punish the exposed king after his burst.")
    fixture(3)
    game.powers.cast(false)
    for n in range(20):game.powers.tick(0.01)
    contact("reap");game.magic.tick(0.05)
    check(game.magic.interactions.groundings>0 and game.powers._hazards[0].get("disarmed",false),"A placed grounded field can interrupt a pending physical dive inside it.")
    fixture(1)
    game.powers.cast(false);contact("reap");game.magic.tick(0.20)
    check(game.powers.busy() and game.powers._hazards.size()>0,"The same field bends pressure lanes without becoming a universal hard counter.")
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
    game._hit_enemy(20,"echo",520.0)
    check(game.enemy.state=="rebuke" and game.enemy.attack_dir==-1,"An old-body frontal echo latches the counter toward that actual ghost source.")
    check(game.boss.knock==0,"A remote old-body guard clash cannot physically shove the real king on the opposite side.")
    var hp:float=game.boss.hp
    for n in range(ceili(float(game.enemy.rebuke_tell)/0.01)+3):game._enemy_step(0.01)
    check(game.boss.hp==hp,"A ghost-baited counter can miss the real king on the opposite side.")
    fixture(5);game.enemy.guard_t=3.0;game.enemy.guard_facing=-1;game.boss.x=680
    game._hit_enemy(20,"cleave")
    check(game.enemy.state!="rebuke" and game.enemy.hp==980,"A genuine rear hit bypasses frontal guard without a compulsory counter.")
    fixture(5);game.enemy.guard_t=3.0;game.boss.guarding=true;game.boss.guard_age=0.01
    game._hurt_boss(20,false,{})
    check(game.enemy.state=="parried" and game.enemy.guard_t==0,"A timed parry opens the enemy shield for a real riposte.")
func readable_counter_case()->void:
    fixture(5);game.enemy.guard_t=3.0;game.enemy.guard_facing=-1;game.boss.facing=1
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
    check(committed and recovered,"A real blocked main Hand finishes its full recovery before the visible counter lands.")
    check(defended and game.boss.hp==game.boss.max,"A real fresh G after Hand recovery can parry the committed body counter without pre-canceling the original strike.")
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
    fixture(5);game.phase=2;game.boss.y=56;game.boss.x=540;game.boss.facing=1
    contact("throw");game._body_spacing()
    check(game.boss.x>game.enemy.x,"Vacant Step's actual phase-pass can cross the body instead of behaving like ordinary walking.")
    fixture(5);game.boss.x=912;game.enemy.x=930;game._body_spacing()
    check(is_finite(game.boss.x) and is_finite(game.enemy.x) and game.boss.x>=48 and game.boss.x<=912 and game.enemy.x-game.boss.x>=43.99,"Mass separation stays finite and non-overlapping against the right arena wall.")
    game.boss.x=48;game.enemy.x=30;game._body_spacing()
    check(is_finite(game.boss.x) and is_finite(game.enemy.x) and game.boss.x-game.enemy.x>=43.99,"Mass separation also resolves overlap against the opposite wall.")
func _run()->void:
    game=load("res://game.gd").new();root.add_child(game);await process_frame;game.set_physics_process(false)
    fixture();check(game.magic.pressure==60,"Each reign begins with a finite60Pressure reserve.")
    for id in ["throw","reap","nova"]:
        fixture();game.magic.pressure=0
        game._start_move(id)
        check(game.move.is_empty() and game.boss.cooldowns[id]==0 and game.move_counts[id]==0,"Unaffordable magic must not consume a cooldown or invent a cast.")
    fixture();game.magic.pressure=0;contact("cleave")
    check(game.enemy.hp<1000 and game.magic.pressure==7,"A free actual unblocked Hand hit must earn exactly7Pressure.")
    fixture();game.enemy.guard_t=2.0;game.enemy.guard_facing=-1;contact("cleave")
    check(game.enemy.hp<1000 and game.magic.pressure==60,"Blocked chip damage must not farm Pressure.")
    fixture();game.magic.pressure=20;game.boss.guarding=true;game.boss.guard_age=0.05
    game._hurt_boss(20,false,{})
    check(game.boss.perfect_blocks==1 and game.magic.pressure==36,"A real perfect parry must earn16Pressure.")
    fixture();game.magic.pressure=20;game.boss.guarding=true;tick_magic(1)
    check(game.magic.pressure==20,"Holding a ward must not passively farm Pressure.")
    game.boss.guarding=false;tick_magic(1)
    check(is_equal_approx(game.magic.pressure,23),"Quiet unguarded rest regenerates only3Pressure per second.")
    fixture();contact("throw")
    check(game.magic.pressure==36 and not game.magic.echo_arm.is_empty(),"Borrowed Hour spends24 and anchors a short-lived recall.")
    check(game.magic.echo_arm.position==Vector2(520,0) and game.projectiles.is_empty(),"The base recall is an old body position, not a replacement projectile.")
    game.move.clear();game.boss.cooldowns.cleave=0;contact("cleave")
    var echo_damage:float=game.move.spec.damage*0.65
    check(game.magic.echo_arm.is_empty() and game.magic.echoes.size()==1,"The next real Hand action becomes one committed delayed body.")
    game.boss.x=680;game.enemy.invuln=0;game.enemy.guard_t=2;game.enemy.guard_facing=1
    var hp:float=game.enemy.hp;var resource:float=game.magic.pressure
    tick_magic(0.64)
    check(is_equal_approx(game.enemy.hp,hp),"The echo must respect its readable0.65second delay.")
    tick_magic(0.02)
    check(is_equal_approx(hp-game.enemy.hp,echo_damage),"The delayed old-position body hits an actual flank through front guard.")
    check(game.magic.pressure==resource and game.magic.interactions.flanks==1,"Echo damage never farms Pressure and guards use the actual attack origin.")
    fixture();game.phase=2;game.boss.y=56;contact("throw")
    check(game.boss.x==720 and game.boss.invuln==0,"Vacant Step physically moves200pixels without free invulnerability.")
    check(game.magic.pressure==32 and game.magic.echoes.size()==1,"Phase2recall spends28 and commits its old body without requiring another button.")
    check(game.magic.echoes[0].x==520,"Vacant Step leaves the body at its real previous origin.")
    fixture();game.enemy.y=65;game.enemy.vy=200;contact("reap")
    var center:float=game.magic.field.x
    game.enemy.x=center+65;game.move.clear();game.magic.tick(0.1)
    check(game.magic.pressure==30 and game.enemy.x<center+65 and game.enemy.y<65,"Royal Burden spends30 to draw mass inward and physically ground it.")
    check(game.enemy.state!="hurt","The field is a positional tool, not a universal hard stun.")
    var pressure:float=game.magic.pressure;game.boss.invuln=0;game._hurt_boss(20,false,{})
    check(game.magic.field.is_empty(),"A real health hit breaks the king's maintained field.")
    game.move.clear();tick_magic(1)
    check(game.magic.pressure==pressure,"Being wounded delays safe Pressure recovery.")
    fixture();game.phase=2;game.boss.y=56;contact("reap");center=game.magic.field.x;game.enemy.x=center+60;game.move.clear();game.magic.tick(0.1)
    check(game.magic.pressure==26 and game.enemy.x>center+60 and game.enemy.y>0,"Unmoored spends34 to lift and repel instead of copying the grounded field.")
    fixture();game.magic.pressure=80;game.enemy.x=game.boss.x+250;contact("nova")
    check(game.magic.pressure==0 and game.move.paid==80,"Ransom spends the entire reserve, not just its minimum cost.")
    check(game.enemy.hp<1000 and game.magic.strain==2.4,"The base blast reaches260pixels and exposes the ward for2.4seconds.")
    var held={"left":false,"right":false,"jump":false,"dash":false,"guard":true,"hold":false,"cleave":false,"throw":false,"reap":false,"nova":false}
    game.move.clear();game._player_step(held,1.0/60.0)
    check(not game.boss.guarding,"The spent-reserve opening cannot immediately be covered by a ward.")
    fixture();game.phase=2;game.boss.y=56;game.magic.pressure=80;game.enemy.x=game.boss.x+349
    game._start_move("nova");game.move.stage="active"
    hp=game.enemy.hp
    for n in range(21):game.move.t=n/60.0;game.move.step=1.0/60.0;game._active_hit()
    check(game.enemy.hp==hp and game.enemy.x<game.boss.x+349,"Empty Throne visibly pulls its outer range before its delayed contact.")
    game.move.t=0.37;game._active_hit()
    check(game.enemy.hp<hp,"A stationary target at349pixels must enter the inner180crush before delayed impact.")
    fixture();contact("throw");game.move.clear();game.magic.clear()
    check(game.magic.echo_arm.is_empty() and game.magic.echoes.is_empty() and game.magic.field.is_empty(),"Ending an encounter clears old memories and fields.")
    hazard_interactions()
    rebuke_cases()
    readable_counter_case()
    spacing_cases()
    game.magic.clear();game.powers.dispel();game.entrances.clear();game._clear_effects();game.ui.reset();game.audio.stop_all();game.Actor._cache.clear();game.Actor._images.clear()
    await create_timer(0.25).timeout;game.queue_free();await process_frame;await process_frame;await create_timer(0.15).timeout
    print(JSON.stringify({"ok":failures.is_empty(),"checks":checks,"failures":failures}));quit(0 if failures.is_empty() else 1)
