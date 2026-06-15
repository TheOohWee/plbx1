import { _decorator, Component, AudioSource, AudioClip } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Audio.ts — one place for music + sfx. Started on the first tap (browsers block
 * autoplay until a user gesture). Other scripts call Audio.i?.playJump() etc.
 */
@ccclass('Audio')
export class Audio extends Component {
    static i: Audio = null;

    @property({ type: AudioClip, tooltip: 'Looping background music' })
    bgm: AudioClip = null;

    @property({ type: AudioClip, tooltip: 'Jump sfx' })
    jump: AudioClip = null;

    @property({ type: AudioClip, tooltip: 'Hit sfx' })
    hit: AudioClip = null;

    @property({ type: AudioClip, tooltip: 'Cash pickup sfx' })
    cash: AudioClip = null;

    @property({ tooltip: 'Music volume 0-1' })
    musicVolume = 0.5;

    @property({ tooltip: 'Hit sfx length in seconds (synthesized — short = snappy)' })
    hitDuration = 0.14;

    @property({ tooltip: 'Hit sfx volume 0-1' })
    hitVolume = 0.5;

    private _src: AudioSource = null;
    private _actx: AudioContext = null;

    onLoad() {
        Audio.i = this;
        this._src = this.getComponent(AudioSource) || this.addComponent(AudioSource);
    }

    /** Lazily create a WebAudio context (web build only). */
    private _ctx(): AudioContext | null {
        if (this._actx) return this._actx;
        const AC = (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
        if (!AC) return null;
        this._actx = new AC();
        return this._actx;
    }

    playBgm() {
        if (this.bgm && this._src && !this._src.playing) {
            this._src.clip = this.bgm;
            this._src.loop = true;
            this._src.volume = this.musicVolume;
            this._src.play();
        }
    }

    private _sfx(clip: AudioClip) {
        if (clip && this._src) this._src.playOneShot(clip, 1);
    }

    playJump() { this._sfx(this.jump); }
    playCash() { this._sfx(this.cash); }

    /**
     * Short synthesized "thud" — a pitch-dropping sine body plus a quick noise
     * click, with a fast exponential decay. Punchy and brief instead of the long
     * clip. Falls back to the assigned clip if WebAudio isn't available.
     */
    playHit() {
        const ctx = this._ctx();
        if (!ctx) { this._sfx(this.hit); return; }
        if (ctx.state === 'suspended') ctx.resume();
        const t = ctx.currentTime;
        const dur = Math.max(0.05, this.hitDuration);
        const vol = this.hitVolume;

        // Body: sine that drops in pitch (a "bonk").
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + dur);
        const og = ctx.createGain();
        og.gain.setValueAtTime(vol, t);
        og.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(og).connect(ctx.destination);
        osc.start(t); osc.stop(t + dur);

        // Click: a tiny noise burst for impact attack.
        const click = Math.min(0.03, dur * 0.4);
        const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * click), ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(vol * 0.6, t);
        ng.gain.exponentialRampToValueAtTime(0.0001, t + click);
        noise.connect(ng).connect(ctx.destination);
        noise.start(t);
    }
}
