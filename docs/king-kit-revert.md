AI-use disclosure: Codex restored the previously accepted royal combat implementation and documented the targeted rollback.

# Restored royal kit

This is the current king-kit contract. It supersedes the v11 body-magic/Pressure sections of sovereign-magic.md. The user rejected that replacement as clunky and requested the previous kit.

The base form again uses Crownsteel's three sword strikes, Oathpiercer's physical thrust, Kneel and Procession. The floating form again uses Gloam Rake, Crownfall's five falling fragments, Royal Undertow and Last Dominion. Their names, timing, damage, recovery, cooldowns, contact logic, sword effects and preparation/contact/recovery frames are restored from commit96261d0.

Pressure, next-strike recording, Vacant Step, the held gravity field, reserve-consuming releases and the temporary post-release guard lockout are removed from live gameplay and the HUD. The unused RoyalMagic implementation and its obsolete verifier are removed; Git and the v11 art provenance preserve the rejected iteration. Ordinary guard stamina and next-hit guard breaks remain.

The individually authored visitor gaits, continuous entrances, fixed stair descent, personal two-exchange dialogue and removal of dialogue-stat bargains remain. The king's sword-bearing locomotion and acting return with the classic kit to avoid a blade appearing only at contact. The v11 visitor powers, body spacing, enemy guard responses, story, menu and endings remain. A classic active thrust may cross the body pushbox, preserving its actual lunge.

Enemy counter preparation allows the restored, longer sword recovery to finish before a fresh defensive response. Its minimum tell is the triggering move's active plus recovery duration plus0.10seconds. This adapts the preserved enemy reactions without slowing or changing the restored player actions.

Validation and publication details are recorded in king-kit-revert-qa.md. Historical generated assets remain credited in ATTRIBUTION.md; this rollback generated no new artwork or music.
