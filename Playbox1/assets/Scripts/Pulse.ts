import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Pulse.ts — gently scales a node up and down to draw the eye (CTA button).
 * Ignores the global pause so it keeps pulsing on the frozen win/lose screen.
 */
@ccclass('Pulse')
export class Pulse extends Component {
    @property({ tooltip: 'Peak scale multiplier (1.08 = +8%)' })
    peak = 1.08;

    @property({ tooltip: 'Seconds per full pulse' })
    period = 0.7;

    private _t = 0;
    private _base = 1;

    onLoad() {
        this._base = this.node.scale.x;
    }

    update(dt: number) {
        this._t += dt;
        const phase = 0.5 * (1 + Math.sin((this._t * 2 * Math.PI) / Math.max(0.01, this.period)));
        const s = this._base * (1 + (this.peak - 1) * phase);
        this.node.setScale(s, s, 1);
    }
}
