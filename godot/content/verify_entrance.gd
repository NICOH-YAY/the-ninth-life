# AI-use disclosure: Codex-authored real native entrance/physics handoff regression checks.
extends SceneTree
var game
var checks=0
var failures:Array=[]
var records:Array=[]
func _initialize() -> void:call_deferred("run")
func check(value:bool,why:String) -> void:
    checks+=1
    if not value:failures.append(why);push_error(why)
func run() -> void:
    game=load("res://game.gd").new();root.add_child(game);await process_frame
    game.set_physics_process(false);game.autoplay=true
    for index in range(9):
        game.epoch+=1;game.life=index;game.fight_index=index;game._reset_bodies();game.mode="entrance"
        game.visitor.setup(game.Rules.LIVES[index]);game.king.visible=true;game.visitor.visible=true
        var previous_completed:int=game.entrances.completed
        game.entrances.enter(index,game.epoch)
        var sample_count=0;var max_king_gap=0.0;var max_visitor_gap=0.0;var min_hp=700.0
        var motions={};var deadline=Time.get_ticks_msec()+20000
        while game.entrances.completed==previous_completed and Time.get_ticks_msec()<deadline:
            await physics_frame
            var s:Dictionary=game.entrances.debug_state()
            max_king_gap=maxf(max_king_gap,s.king_gap);max_visitor_gap=maxf(max_visitor_gap,s.visitor_gap)
            min_hp=minf(min_hp,game.boss.hp);motions[game.visitor.current_motion]=true;sample_count+=1
        check(game.entrances.completed==previous_completed+1,"Entrance %s resolves in bounded time"%index)
        check(max_king_gap<0.01 and max_visitor_gap<0.01,"Entrance %s keeps rendered/logical feet synchronized"%index)
        check(game.boss.y==0 and game.enemy.y==0,"Entrance %s finishes on the exact arena floor"%index)
        check(game.boss.hp==game.boss.max and min_hp>0,"Entrance %s preserves a fair playable health state"%index)
        check(game.enemy.idle_clock==0 and game.boss.idle_clock==0,"Entrance %s hands off independent neutral idle clocks"%index)
        check(not game.enemy.walk_was_moving and not game.boss.walk_was_moving,"Entrance %s ends walking before dialogue"%index)
        var king_pos:Vector2=game.king.position;var enemy_pos:Vector2=game.visitor.position
        game.mode="arrival";game.mode_t=1.3;game._animate()
        check(game.king.position.distance_to(king_pos)<0.01 and game.visitor.position.distance_to(enemy_pos)<0.01,"Entrance %s handoff does not teleport either body"%index)
        records.append({"life":index,"samples":sample_count,"king_gap":max_king_gap,"visitor_gap":max_visitor_gap,"motions":motions.keys()})
    game.epoch+=1;game.life=7;game.fight_index=7;game._reset_bodies();game.mode="entrance";game.visitor.setup("quiet")
    game.entrances.enter(7,game.epoch)
    check(game.audio.dialogue_active,"The silence entrance really ducks the current score before its interruption.")
    game.epoch+=1;game.mode="arrival";game.entrances.clear();await physics_frame;await physics_frame
    check(not game.audio.dialogue_active and game.entrances.props.is_empty(),"Cancelling the silence entrance releases the audio duck and removes all staged props.")
    game.magic.clear();game.powers.dispel();game.entrances.clear();game._clear_effects();game.ui.reset();game.audio.stop_all();game.Actor._cache.clear();game.Actor._images.clear()
    await create_timer(0.25).timeout;game.queue_free();await process_frame;await process_frame;await create_timer(0.15).timeout
    print(JSON.stringify({"ok":failures.is_empty(),"checks":checks,"failures":failures,"entrances":records}));quit(0 if failures.is_empty() else 1)
