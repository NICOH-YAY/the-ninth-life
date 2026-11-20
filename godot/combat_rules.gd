# AI-use disclosure: Codex-authored deterministic Godot combat data port and royal second stance.
extends RefCounted

const LIVES = ["kitten","alley","sailor","acrobat","witch","knight","thief","quiet","patchwork"]
const YEARS = [1000,1089,1193,1324,1488,1672,1880,2116,2400]
const COLORS = [Color("#e0c697"),Color("#ff6979"),Color("#efb95a"),Color("#51e6b2"),Color("#cb8bff"),Color("#7bc9ff"),Color("#50e1a8"),Color("#b0eeff"),Color("#ffb05f")]
const MELEE = [
 {"reach":44.0,"tell":0.50,"height":60.0,"impulse":80.0,"lift":0.0,"guard":0.0},
 {"reach":64.0,"tell":0.48,"height":65.0,"impulse":-220.0,"lift":0.0,"guard":0.0},
 {"reach":112.0,"tell":0.46,"height":75.0,"impulse":310.0,"lift":0.0,"guard":0.12},
 {"reach":60.0,"tell":0.44,"height":110.0,"impulse":180.0,"lift":0.0,"guard":0.0},
 {"reach":86.0,"tell":0.48,"height":100.0,"impulse":130.0,"lift":230.0,"guard":0.0},
 {"reach":96.0,"tell":0.55,"height":70.0,"impulse":460.0,"lift":190.0,"guard":0.18},
 {"reach":52.0,"tell":0.40,"height":60.0,"impulse":120.0,"lift":0.0,"guard":0.0},
 {"reach":140.0,"tell":0.54,"height":105.0,"impulse":270.0,"lift":0.0,"guard":0.0},
 {"reach":90.0,"tell":0.50,"height":88.0,"impulse":340.0,"lift":100.0,"guard":0.10}]
const ABILITY_TELL = [1.0,0.72,0.95,0.78,1.05,1.15,0.75,0.90,0.95]
const POISE = [55.0,76.0,100.0,70.0,72.0,125.0,68.0,90.0,108.0]
const RECOVERY = [0.65,0.40,0.60,0.42,0.48,0.68,0.38,0.52,0.46]
const ABILITY_CD = [3.8,2.15,3.1,2.7,2.8,3.5,2.9,2.4,2.25]
const MOVES = {
 "cleave":{"name":"Crownsteel","tell":0.2,"active":0.085,"recover":0.28,"cooldown":0.4,"damage":28.0},
 "throw":{"name":"Oathpiercer","tell":0.34,"active":0.1,"recover":0.36,"cooldown":1.15,"damage":34.0},
 "reap":{"name":"Kneel","tell":0.78,"active":0.12,"recover":0.42,"cooldown":1.65,"damage":32.0},
 "nova":{"name":"Procession","tell":1,"active":0.44,"recover":0.48,"cooldown":8,"damage":36.0}}
const CROWN_MOVES = {
 "cleave":{"name":"Gloam Rake","tell":0.26,"active":0.11,"recover":0.34,"cooldown":0.46,"damage":22.0},
 "throw":{"name":"Crownfall","tell":0.72,"active":0.42,"recover":0.38,"cooldown":1.35,"damage":13.0},
 "reap":{"name":"Royal Undertow","tell":0.95,"active":0.4,"recover":0.46,"cooldown":1.65,"damage":32.0},
 "nova":{"name":"Last Dominion","tell":1.18,"active":0.58,"recover":0.58,"cooldown":7,"damage":84.0}}

# Per-life footwork: grounded practice, rushes, anchor slide, vault, blink-step,
# armored charge, crossing dash, ice glide and the returning sword's pursuit.
const MOBILITY = [
 {"speed":220.0,"duration":0.14,"cooldown":3.4,"chain":1,"hop":0.0},
 {"speed":650.0,"duration":0.22,"cooldown":1.55,"chain":2,"hop":0.0},
 {"speed":430.0,"duration":0.24,"cooldown":2.40,"chain":1,"hop":0.0},
 {"speed":610.0,"duration":0.26,"cooldown":1.75,"chain":2,"hop":480.0},
 {"speed":720.0,"duration":0.17,"cooldown":2.15,"chain":1,"hop":0.0},
 {"speed":560.0,"duration":0.27,"cooldown":2.40,"chain":2,"hop":220.0},
 {"speed":820.0,"duration":0.20,"cooldown":1.45,"chain":3,"hop":0.0},
 {"speed":490.0,"duration":0.30,"cooldown":2.20,"chain":2,"hop":0.0},
 {"speed":720.0,"duration":0.25,"cooldown":1.35,"chain":3,"hop":280.0}
]

static func move_spec(id: String, phase: int) -> Dictionary:
 return (CROWN_MOVES[id] if phase == 2 else MOVES[id]).duplicate()

static func stats(index: int) -> Dictionary:
 if index == 0:
  return {"hp":260.0,"damage":4.0,"speed":145.0}
 return {"hp":250.0+52.0*(index-1),"damage":16.0+3.5*(index-1),"speed":175.0+12.0*(index-1)}

static func shot(origin: Vector2, target: Vector2, speed: float, angle_offset: float=0.0) -> Dictionary:
 var angle = (target-origin).angle()+angle_offset
 return {"p":origin,"v":Vector2.from_angle(angle)*speed,"radius":12.0,"low":false,"ttl":3.0,"scale":0.7,"gravity":0.0,"return_at":0.0}

static func enemy_shots(index: int, origin: Vector2, target: Vector2, serial: int) -> Array:
 var side = -1.0 if target.x < origin.x else 1.0
 var out: Array = []
 var p: Dictionary
 match index:
  0:
   p=shot(Vector2(origin.x,13),Vector2(target.x,13),220);p.low=true;p.scale=0.55;out.append(p)
  1:
   p=shot(Vector2(origin.x,16),Vector2(target.x,16),620);p.low=true;p.ttl=0.82;p.scale=0.6;out.append(p)
   p=shot(origin,target,410);p.gravity=160.0;p.ttl=1.0;p.scale=0.65;out.append(p)
  2:
   p=shot(origin,target,390);p.radius=22.0;p.return_at=265.0;p.scale=1.05;out.append(p)
  3:
   for spread in [-0.30,0.0,0.30]:
    p=shot(origin,target,390,spread);p.radius=15.0;p.scale=0.58;out.append(p)
  4:
   for n in range(3):
    p=shot(origin,target,320.0+n*65.0,(n-1)*0.16);p.radius=9.0;p.scale=0.65;out.append(p)
  5:
   p=shot(Vector2(origin.x,16),Vector2(target.x,16),265);p.low=true;p.radius=32.0;p.scale=1.35;p.ttl=4.0;out.append(p)
  6:
   p=shot(origin,target,540);p.scale=0.8;out.append(p)
   p=shot(Vector2(origin.x,13),Vector2(target.x,13),365);p.low=true;p.scale=0.65;out.append(p)
  7:
   var low = serial%2==0
   p=shot(Vector2(origin.x,14 if low else 88),Vector2(target.x,14 if low else 88),450 if low else 490);p.low=low;p.scale=0.95;out.append(p)
  8:
   for spread in [-0.20,0.20]:
    p=shot(origin,target,430,spread);p.radius=16.0;p.scale=0.8;out.append(p)
   p=shot(Vector2(origin.x,14),Vector2(target.x,14),330);p.low=true;p.scale=0.65;out.append(p)
 for item in out:
  item.v.x=absf(item.v.x)*side
 return out
