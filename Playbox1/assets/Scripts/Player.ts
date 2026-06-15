import { _decorator, CCInteger, Color, Component, Input, input, Sprite, SpriteAtlas, SpriteFrame } from 'cc';
import { GameState } from './GameState';
import { Audio } from './Audio';
const { ccclass, property } = _decorator;

enum State { RUN, JUMP, HIT, WIN }

/**
 * Player.ts (Step 4 — run + tap-to-jump)
 * Run = looped frame cycle. Jump = ballistic arc (vy + gravity), playing jump frames across the arc.
 * Game logic (hit, death, gating) added in later steps.
 */
@ccclass('Player')
export class Player extends Component {
    @property({ type: SpriteAtlas, tooltip: 'Drag the Player sprite atlas (.plist) here' })
    atlas: SpriteAtlas = null;

    @property({ type: [CCInteger], tooltip: 'Run cycle frame order' })
    runFrames: number[] = [11, 25, 19, 36, 37, 14, 26];

    @property({ type: [CCInteger], tooltip: 'Jump arc: 6=crouch, 1/4=legs tilted, 2/3=straight' })
    jumpFrames: number[] = [6, 1, 2, 3];

    @property({ tooltip: 'Run animation speed (frames per second)' })
    fps = 14;

    @property({ tooltip: 'Initial upward jump speed (px/sec)' })
    jumpVelocity = 950;

    @property({ tooltip: 'Gravity magnitude (px/sec^2)' })
    gravity = 2600;

    @property({ type: [CCInteger], tooltip: 'Hit/stumble pose frames (0,5 = surprised)' })
    hitFrames: number[] = [0, 5];

    @property({ tooltip: 'How long the hit reaction lasts (seconds)' })
    hitDuration = 0.4;

    @property({ tooltip: 'Flash color while hit' })
    hitColor: Color = new Color(80, 255, 80, 255);

    @property({ tooltip: 'Frame to hold when she wins (celebration/stop pose)' })
    winFrame = 8;

    private _sprite: Sprite = null;
    private _frames: SpriteFrame[] = [];
    private _acc = 0;
    private _idx = 0;
    private _state = State.RUN;
    private _groundY = 0;
    private _baseY = 0;
    private _vy = 0;
    private _airT = 0;
    private _airDur = 0;
    private _hitT = 0;
    private _baseColor: Color = Color.WHITE.clone();

    onLoad() {
        this._sprite = this.getComponent(Sprite);
        this._loadFrames();
        if (this._sprite) this._baseColor = this._sprite.color.clone();
        this._baseY = this.node.position.y;
        this._groundY = this._baseY;
        input.on(Input.EventType.TOUCH_START, this.onTap, this);
        input.on(Input.EventType.MOUSE_DOWN, this.onTap, this);
    }

    onDestroy() {
        input.off(Input.EventType.TOUCH_START, this.onTap, this);
        input.off(Input.EventType.MOUSE_DOWN, this.onTap, this);
    }

    private onTap() {
        if (GameState.paused) return; // ignore taps before start / while frozen
        if (this._state === State.RUN) this._startJump();
    }

    /**
     * Called by WorldFit when the screen orientation/size changes. Re-bases the
     * ground line so the player stays planted on the world's ground in any
     * orientation. We only snap her down if she's not mid-jump (so a rotate
     * during a jump doesn't teleport her).
     */
    public setGroundOffsetY(offset: number) {
        this._groundY = this._baseY + offset;
        if (this._state !== State.JUMP) {
            this.node.setPosition(this.node.position.x, this._groundY, this.node.position.z);
        }
    }

    /** Called by GameManager on win — hold a celebration/stop pose on the ground. */
    public celebrate() {
        this._state = State.WIN;
        this._vy = 0;
        this.node.setPosition(this.node.position.x, this._groundY, this.node.position.z);
        if (this._sprite) {
            this._sprite.color = this._baseColor;
            this._setFrame(this.winFrame);
        }
    }

    /** Called by GameManager when she runs into an obstacle/enemy on the ground. */
    public playHit() {
        if (this._state === State.HIT) return;
        this._state = State.HIT;
        this._hitT = 0;
        this._idx = 0;
        this._acc = 0;
        // Snap back to the ground (a hit interrupts a jump, so land her immediately).
        this._vy = 0;
        this.node.setPosition(this.node.position.x, this._groundY, this.node.position.z);
        if (this._sprite) this._sprite.color = this.hitColor;
    }

    /** Public trigger so GameManager can make her jump (e.g. ending the jump tutorial). */
    public jump() {
        if (this._state === State.RUN) this._startJump();
    }

    private _startJump() {
        this._state = State.JUMP;
        Audio.i?.playJump();
        this._vy = this.jumpVelocity;
        this._airT = 0;
        this._airDur = (2 * this.jumpVelocity) / this.gravity; // total time aloft
        this._idx = 0;
        this._acc = 0;
    }

    private _loadFrames() {
        this._frames = [];
        if (!this.atlas) { console.warn('[Player] No atlas assigned'); return; }
        let i = 0;
        while (true) {
            const f = this.atlas.getSpriteFrame(String(i)) || this.atlas.getSpriteFrame(i + '.png');
            if (!f) break;
            this._frames.push(f);
            i++;
            if (i > 999) break;
        }
        console.log(`[Player] loaded ${this._frames.length} frames`);
    }

    private _setFrame(frameIdx: number) {
        const f = this._frames[frameIdx];
        if (f && this._sprite.spriteFrame !== f) this._sprite.spriteFrame = f;
    }

    update(dt: number) {
        if (GameState.paused || this._state === State.WIN) return; // hold the celebration pose
        if (!this._sprite || this._frames.length === 0) return;
        if (this._state === State.HIT) this._updateHit(dt);
        else if (this._state === State.JUMP) this._updateJump(dt);
        else this._updateRun(dt);
    }

    private _updateHit(dt: number) {
        this._hitT += dt;
        const seq = this.hitFrames;
        if (seq && seq.length > 0) {
            const p = Math.min(0.999, this._hitT / Math.max(0.0001, this.hitDuration));
            this._setFrame(seq[Math.floor(p * seq.length)]);
        }
        if (this._hitT >= this.hitDuration) {
            this._state = State.RUN;
            this._idx = 0;
            this._acc = 0;
            if (this._sprite) this._sprite.color = this._baseColor;
        }
    }

    private _updateRun(dt: number) {
        const seq = this.runFrames;
        if (!seq || seq.length === 0) return;
        this._acc += dt;
        const step = 1 / Math.max(1, this.fps);
        while (this._acc >= step) {
            this._acc -= step;
            this._idx = (this._idx + 1) % seq.length;
        }
        this._setFrame(seq[this._idx]);
    }

    private _updateJump(dt: number) {
        this._airT += dt;
        let y = this.node.position.y + this._vy * dt;
        this._vy -= this.gravity * dt;
        if (y <= this._groundY) {
            y = this._groundY;
            this._state = State.RUN;
            this._idx = 0;
            this._acc = 0;
        }
        this.node.setPosition(this.node.position.x, y, this.node.position.z);

        const seq = this.jumpFrames;
        if (seq && seq.length > 0) {
            const p = Math.min(0.999, this._airT / Math.max(0.0001, this._airDur));
            this._setFrame(seq[Math.floor(p * seq.length)]);
        }
    }
}
