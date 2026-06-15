import { _decorator, Component, Graphics, Color } from 'cc';
const { ccclass, property } = _decorator;

interface P { x: number; y: number; px: number; py: number; pin: boolean; }

/**
 * FinishTape.ts — the finish ribbon with a real rope effect (verlet simulation).
 * A row of points hangs between two posts and sags under gravity. snap() tears it
 * at the middle and flings the halves so the player visibly bursts through it.
 * Drawn each frame with Graphics (checkered band + two posts) — no sprite needed.
 */
@ccclass('FinishTape')
export class FinishTape extends Component {
    @property({ tooltip: 'Distance between the two posts (px)' })
    width = 240;

    @property({ tooltip: 'Post bottom relative to node (down to the road)' })
    postBottom = -150;

    @property({ tooltip: 'Post top relative to node' })
    postTop = 120;

    @property({ tooltip: 'Rope resolution (more = smoother sag)' })
    segments = 18;

    @property({ tooltip: 'Sag/fall strength' })
    gravity = 1400;

    @property({ tooltip: 'Velocity damping (0-1)' })
    damping = 0.98;

    @property({ tooltip: 'Thickness of the checkered tape band (px)' })
    bandThickness = 46;

    private _g: Graphics = null;
    private _pts: P[] = [];
    private _rest = 0;
    private _splitAt = 0;
    private _broken = false;
    private _fade = 1;

    private _post = new Color(92, 98, 110, 255);
    private _dark = new Color(70, 75, 85, 255);
    private _light = new Color(242, 244, 247, 255);

    onLoad() {
        this._g = this.getComponent(Graphics) || this.addComponent(Graphics);
        this._initRope();
    }

    private _initRope() {
        this._pts = [];
        const n = this.segments;
        const left = -this.width / 2;
        for (let i = 0; i <= n; i++) {
            const x = left + this.width * (i / n);
            this._pts.push({ x, y: 0, px: x, py: 0, pin: (i === 0 || i === n) });
        }
        this._rest = (this.width / n) * 1.07; // slightly slack -> natural sag
        this._splitAt = Math.floor(n / 2);
    }

    /** Tear the tape — she burst through. dir: +1 fling right, -1 left. */
    public snap(dir: number = 1) {
        if (this._broken) return;
        this._broken = true;
        const mid = this._splitAt;
        for (let i = 1; i < this._pts.length - 1; i++) {
            const strength = 1 - Math.abs(i - mid) / mid; // strongest at the middle
            const p = this._pts[i];
            p.px = p.x - dir * 140 * strength; // set prev so velocity points forward
            p.py = p.y + 50 * strength;
        }
    }

    update(dt: number) {
        if (!this._g) return;
        this._simulate(Math.min(dt, 0.033));
        if (this._broken) this._fade = Math.max(0, this._fade - dt * 0.6);
        this._draw();
    }

    private _simulate(dt: number) {
        const g = this.gravity * dt * dt;
        for (const p of this._pts) {
            if (p.pin) continue;
            const vx = (p.x - p.px) * this.damping;
            const vy = (p.y - p.py) * this.damping;
            p.px = p.x; p.py = p.y;
            p.x += vx; p.y += vy - g;
        }
        for (let k = 0; k < 10; k++) {
            for (let i = 0; i < this._pts.length - 1; i++) {
                if (this._broken && i === this._splitAt) continue; // torn at the middle
                const a = this._pts[i], b = this._pts[i + 1];
                const dx = b.x - a.x, dy = b.y - a.y;
                const dist = Math.hypot(dx, dy) || 0.0001;
                const diff = (dist - this._rest) / dist;
                const ox = dx * 0.5 * diff, oy = dy * 0.5 * diff;
                if (!a.pin) { a.x += ox; a.y += oy; }
                if (!b.pin) { b.x -= ox; b.y -= oy; }
            }
        }
    }

    private _draw() {
        const g = this._g;
        g.clear();

        // Posts
        const lx = -this.width / 2, rx = this.width / 2;
        g.lineWidth = 18;
        g.strokeColor = this._post;
        g.moveTo(lx, this.postBottom); g.lineTo(lx, this.postTop); g.stroke();
        g.moveTo(rx, this.postBottom); g.lineTo(rx, this.postTop); g.stroke();
        g.fillColor = this._post;
        g.circle(lx, this.postTop, 12); g.fill();
        g.circle(rx, this.postTop, 12); g.fill();

        // Checkered tape band following the rope
        const a255 = Math.floor(255 * this._fade);
        const th = this.bandThickness;
        for (let i = 0; i < this._pts.length - 1; i++) {
            if (this._broken && i === this._splitAt) continue;
            const a = this._pts[i], b = this._pts[i + 1];
            const col = (i % 2 === 0) ? this._light : this._dark;
            col.a = a255;
            g.fillColor = col;
            const dx = b.x - a.x, dy = b.y - a.y;
            const len = Math.hypot(dx, dy) || 0.0001;
            const nx = -dy / len * th / 2, ny = dx / len * th / 2;
            g.moveTo(a.x + nx, a.y + ny);
            g.lineTo(b.x + nx, b.y + ny);
            g.lineTo(b.x - nx, b.y - ny);
            g.lineTo(a.x - nx, a.y - ny);
            g.close(); g.fill();
        }
    }
}
