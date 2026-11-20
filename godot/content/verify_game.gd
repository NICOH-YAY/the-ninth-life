# AI-use disclosure: Codex-authored native Godot behavioral checks for the gameplay port.
extends SceneTree
var checks=0
var game
func _initialize() -> void:
    call_deferred("_run")
func check(value:bool,why:String) -> void:
    checks+=1
    if not value:
        push_error(why)
        quit(1)
func blank_input() -> Dictionary:
    return {"left":false,"right":false,"jump":false,"dash":false,"guard":false,"hold":false,"cleave":false,"throw":false,"reap":false,"nova":false}
func fixture(index:int=1) -> void:
    game.life=index
    game.fight_index=index
    game._reset_bodies()
    game.mode="fight"
    game.enemy.state="wait"
    game.enemy.x=game.boss.x-90
    game.enemy.decision=100.0
    game.enemy.ability_cd=100.0
func _run() -> void:
    game=load("res://game.gd").new()
    root.add_child(game)
    await process_frame
    game.set_physics_process(false)
    fixture()
    var input=blank_input()
    input.left=true
    for n in range(30):game._player_step(input,1.0/60.0)
    check(game.boss.x<675,"Royal movement crosses the arena independently of throne")
    input=blank_input();input.jump=true
    game._player_step(input,1.0/60.0)
    check(game.boss.y>0 and game.boss.jumps==1,"Jump has actual upward velocity")
    input=blank_input()
    for n in range(100):game._player_step(input,1.0/60.0)
    check(game.boss.grounded and game.boss.y==0,"Jump lands on exact floor")
    input.dash=true
    game._player_step(input,1.0/60.0)
    check(game.boss.dashes==1 and game.boss.invuln>0,"Dash moves and protects")
    fixture()
    game.boss.guarding=true
    var hp:float=game.boss.hp
    game._hurt_boss(20,false,{})
    check(game.boss.blocks==1 and game.boss.hp>hp-6,"Guard reduces real damage")
    fixture(0)
    game.enemy.hp=2.0
    game._hit_enemy(30,"cleave")
    check(game.enemy.hp==1,"Tutorial cannot be skipped by damage before jump dash block")
    game.boss.jumps=1;game.boss.dashes=1;game.boss.blocks=1
    game._hit_enemy(30,"cleave")
    check(game.enemy.hp<=0,"Real tutorial actions permit victory")
    fixture()
    game._start_move("throw")
    var before:float=game.boss.x
    for n in range(25):
        game._player_step(blank_input(),1.0/60.0)
        game._move_step(1.0/60.0)
    check(game.boss.x<before and game.projectiles.is_empty(),"Base sword thrust is physical lunge")
    fixture()
    game.phase=2
    game.enemy.hp=5000.0
    game.enemy.max=5000.0
    game.enemy.x=game.boss.x-350
    game._start_move("throw")
    for n in range(50):game._move_step(1.0/60.0)
    check(game.projectiles.size()==5,"Crownfall releases five actual descending crown blades")
    check(not ResourceLoader.exists("res://art/boss-monster.png"),"Old six-armed monster is not reused for the new form")
    fixture()
    game.boss.hp=345.0
    game._begin_crown_stance()
    check(game.boss.phase_triggered and game.boss.transition>0,"Crown stance triggers with bounded transition")
    check(game.phase==1,"Transition does not instantly skip its animation")
    var unique={}
    for data in game.Rules.MELEE:unique[JSON.stringify(data)]=true
    check(unique.size()==9,"Nine visitors retain independent contact weapon profiles")
    for index in range(9):
        var shots=game.Rules.enemy_shots(index,Vector2(200,42),Vector2(800,42),0)
        check(shots.size()>0,"Each visitor has actual ranged patterns")
    fixture()
    var tapping=blank_input()
    tapping.cleave=true;tapping.cleave_taps=2
    game._player_step(tapping,1.0/60.0)
    check(game.boss.combo_queue==1 and not game.move.is_empty(),"Second fast press remains buffered during first slash")
    for n in range(20):
        game.combat_clock+=1.0/60.0
        game._player_step(blank_input(),1.0/60.0)
        game._move_step(1.0/60.0)
    check(game.boss.combo_history==[0,1],"Buffered follow-up starts a different second slash")
    fixture()
    game._start_move("cleave");game._start_move("cleave");game._start_move("cleave")
    check(game.boss.combo_history==[0,1,2],"Three successive attacks use all three combo stages")
    game.combat_clock=2.0;game._start_move("cleave")
    check(game.boss.combo==0,"A pause resets combo to its opening slash")
    fixture()
    var moving=blank_input();moving.right=true
    game._player_step(moving,1.0/60.0)
    check(game.boss.vx>0 and game.boss.vx<310,"Movement eases into full speed")
    for n in range(30):game._player_step(moving,1.0/60.0)
    check(game.boss.steps>0,"Ground travel generates actual foot contacts")
    game.boss.grounded=false;game.boss.y=100;game.boss.vy=0
    var steps:int=game.boss.steps
    for n in range(6):game._player_step(moving,1.0/60.0)
    check(game.boss.steps==steps,"Airborne travel produces no running footsteps")
    fixture(3)
    game.enemy.x=200;game.enemy.state="attack";game.enemy.mobility_cd=0
    game._enemy_step(1.0/60.0)
    check(game.enemy.state=="dash" and game.enemy.dashes==1,"Acrobat proactively vault-dashes from range")
    check(game.enemy.vy>0,"Acrobat mobility includes a real ballistic vault")
    fixture(6)
    game.enemy.state="attack";game.enemy.x=game.boss.x-60;game.enemy.chain_left=3
    for n in range(90):game._enemy_step(1.0/60.0)
    check(game.enemy.strikes>=2,"Dagger visitor executes repeated real melee attacks")
    fixture()
    game._hud()
    for label in game.ui.get("_move_labels"):
        check(not label.text.contains("null"),"Every skill name is a real label")
    game.mode="ending"
    game.ui.hide_hud()
    game._hud()
    check(not game.ui.get("_hud").visible,"Ending never re-enables combat HUD")
    game._clear_effects()
    game.ui.reset()
    game.audio.stop_all()
    game.Actor._cache.clear()
    game.Actor._images.clear()
    await create_timer(0.2).timeout
    game.queue_free()
    await process_frame
    await process_frame
    await create_timer(0.15).timeout
    print(JSON.stringify({"native_game_checks":checks,"ok":true}))
    quit(0)
