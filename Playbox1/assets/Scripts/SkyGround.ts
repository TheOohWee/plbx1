import { _decorator, Component, Graphics, Color, view } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;

/**
 * SkyGround.ts — fills the whole viewport with a gradient sky (top) and a ground
 * band (bottom), sized to the live visible size and redrawn on resize/rotate.
 * It's the back-most layer so the screen is never black in any orientation.
 * The scrolling BG, scenery, etc. sit on top of this.
 */
@ccclass('SkyGround')
@executeInEditMode(true)
export class SkyGround extends Component {
    @property({ tooltip: 'Sky color at the very top' })
    skyTop: Color = new Color(253, 240, 238, 255);

    @property({ tooltip: 'Sky color at the horizon (matches BG sky)' })
    skyHorizon: Color = new Color(247, 222, 219, 255);

    @property({ tooltip: 'Ground color (matches BG grass)' })
    ground: Color = new Color(173, 186, 93, 255);

    @property({ tooltip: 'Where sky meets ground, as a fraction down the screen (0 top .. 1 bottom)' })
    horizonFrac = 0.62;

    @property({ tooltip: 'Gradient smoothness' })
    strips = 48;

    private _last = '';

    onLoad() { this._draw(); }

    update() {
        const vs = view.getVisibleSize();
        const k = `${vs.width | 0}x${vs.height | 0}`;
        if (k !== this._last) { this._last = k; this._draw(); }
    }

    private _draw() {
        const g = this.getComponent(Graphics) || this.addComponent(Graphics);
        const vs = view.getVisibleSize();
        const w = Math.max(vs.width, 64) * 1.2;
        const h = Math.max(vs.height, 64) * 1.2;
        const top = h / 2, bottom = -h / 2;
        const horizonY = top - h * this.horizonFrac;

        g.clear();
        // Sky gradient, top -> horizon
        const n = Math.max(2, this.strips);
        for (let i = 0; i < n; i++) {
            const t = i / n;
            const y0 = top - (top - horizonY) * t;
            const y1 = top - (top - horizonY) * ((i + 1) / n);
            g.fillColor = this._lerp(this.skyTop, this.skyHorizon, t);
            g.rect(-w / 2, y1, w, y0 - y1 + 1);
            g.fill();
        }
        // Ground
        g.fillColor = this.ground;
        g.rect(-w / 2, bottom, w, horizonY - bottom);
        g.fill();
    }

    private _lerp(a: Color, b: Color, t: number): Color {
        return new Color(
            a.r + (b.r - a.r) * t,
            a.g + (b.g - a.g) * t,
            a.b + (b.b - a.b) * t,
            255
        );
    }
}
