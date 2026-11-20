AI-use disclosure: Codex ported existing licensed recordings and edited source Foley for the native Godot adaptation.

# Godot score and cleaner sword sound
CourtAudio uses two AudioStreamPlayers for the score. Repeated requests for the same playing cue do not reload it. A new cue replaces the fading slot, crossfades over1.25seconds and stops the old player. Returning to a scene resumes its stored position, and repeated clips overlap only at their boundary. Dialogue lowers music smoothly to25% and Master mute covers every music/effect voice. The finale does not loop.

The twelve existing Scott Buckley CC BY4.0 compositions are retained with lower scene gains. They remain different recordings for menu, passing years, nine visitors and aftermath. Full attribution, original download provenance and edits are in assets/audio-v5/manifest.json and ATTRIBUTION.md. Godot packages these recordings in its web PCK, so playback is lazy but this is not described as lazy network downloading.

Fifteen Chequered Ink effects were re-edited directly from the authorized local source pack. The new sword, guard, flesh, stab, dash and material cues use isolated single recordings at their original pitch, instead of the older slowed and layered mixes. Short fades, a110Hz high-pass,11kHz low-pass and a0.8peak limiter preserve a cleaner transient. OGG Vorbis game derivatives and exact hashes/processing are recorded in audio-processing.json. Raw unmodified source-pack files remain ignored.

Web uses Godot sample playback for low-latency Foley and stream playback for score. Native audio uses stream playback for both, because the native/headless driver does not support Web sample playback. No runtime audio effect chain is required. stop_all() releases voices before shutdown.

The native court verifier passed67checks: all nine dialogue trees, all twelve real music streams, all fifteen recorded sounds, same-cue no-restart, bounded two-player crossfades, dialogue duck, Master mute, Up/Down/Enter choices, key remapping and ConfigFile persistence. The isolated test profile is on D:, and the final run has no engine errors or warnings. Logs: output/qa/godot-court/verify.log. Command: Godot --headless --path godot --script res://content/verify_court.gd with a D-drive APPDATA profile.
