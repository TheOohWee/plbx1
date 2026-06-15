import { _decorator, Component, Label } from 'cc';
const { ccclass, property } = _decorator;

/**
 * WinScreen.ts — the "Congratulations!" reward overlay.
 * Hidden until GameManager calls show(reward). Fills the reward amount and runs
 * a count-down ("00:59 … next payment in one minute"). Does NOT respect the
 * global pause, so the timer keeps ticking while the world is frozen.
 */
@ccclass('WinScreen')
export class WinScreen extends Component {
    @property({ type: Label, tooltip: 'The "$N.NN" reward amount on the card' })
    rewardLabel: Label = null;

    @property({ type: Label, tooltip: 'The "00:59" countdown label' })
    countdownLabel: Label = null;

    @property({ tooltip: 'Countdown start (seconds)' })
    startSeconds = 59;

    private _t = 0;
    private _running = false;

    onLoad() {
        this.node.active = false; // hidden until win
    }

    show(reward: number) {
        this.node.active = true;
        if (this.rewardLabel) this.rewardLabel.string = '$' + reward.toFixed(2);
        this._t = this.startSeconds;
        this._running = true;
        this._refresh();
    }

    update(dt: number) {
        if (!this._running) return;
        this._t = Math.max(0, this._t - dt);
        this._refresh();
    }

    private _refresh() {
        if (!this.countdownLabel) return;
        const s = Math.ceil(this._t);
        const m = Math.floor(s / 60);
        const ss = s % 60;
        this.countdownLabel.string =
            String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
    }
}
