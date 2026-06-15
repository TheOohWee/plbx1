import { _decorator, CCInteger, Component, Sprite, SpriteAtlas, SpriteFrame } from 'cc';
import { GameState } from './GameState';
const { ccclass, property } = _decorator;

/**
 * Enemy.ts — looping run animation for the bald runner.
 * He scrolls with the Track (placed there) and is treated as a hazard by
 * GameManager (jump over him, or take a hit). Art faces right, so flipX faces
 * him left toward the player.
 */
@ccclass('Enemy')
export class Enemy extends Component {
    @property({ type: SpriteAtlas, tooltip: 'Drag the Enemy sprite atlas (.plist) here' })
    atlas: SpriteAtlas = null;

    @property({ type: [CCInteger], tooltip: 'Run cycle frame order' })
    runFrames: number[] = [0, 8, 13, 6, 12, 15, 3, 5, 1, 4, 14, 7, 16, 19, 18, 10, 11, 9, 17, 2];

    @property({ tooltip: 'Animation speed (frames per second)' })
    fps = 16;

    @property({ tooltip: 'Face left toward the player (art faces right)' })
    flipX = true;

    @property({ tooltip: 'Extra leftward speed toward the player, on top of track scroll (px/sec)' })
    moveSpeed = 150;

    private _sprite: Sprite = null;
    private _frames: SpriteFrame[] = [];
    private _acc = 0;
    private _idx = 0;

    onLoad() {
        this._sprite = this.getComponent(Sprite);
        this._loadFrames();
        if (this.flipX) {
            const s = this.node.scale;
            this.node.setScale(-Math.abs(s.x), s.y, s.z);
        }
    }

    private _loadFrames() {
        this._frames = [];
        if (!this.atlas) { console.warn('[Enemy] No atlas assigned'); return; }
        let i = 0;
        while (true) {
            const f = this.atlas.getSpriteFrame(String(i)) || this.atlas.getSpriteFrame(i + '.png');
            if (!f) break;
            this._frames.push(f);
            i++;
            if (i > 999) break;
        }
    }

    update(dt: number) {
        if (GameState.paused) return;
        // Run toward the player: move left within the Track, on top of the track's own scroll.
        if (this.moveSpeed !== 0) {
            const p = this.node.position;
            this.node.setPosition(p.x - this.moveSpeed * dt, p.y, p.z);
        }

        if (!this._sprite || this._frames.length === 0) return;
        const seq = this.runFrames;
        if (!seq || seq.length === 0) return;
        this._acc += dt;
        const step = 1 / Math.max(1, this.fps);
        while (this._acc >= step) {
            this._acc -= step;
            this._idx = (this._idx + 1) % seq.length;
        }
        const f = this._frames[seq[this._idx]];
        if (f && this._sprite.spriteFrame !== f) this._sprite.spriteFrame = f;
    }
}
