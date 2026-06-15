import { _decorator, Component, Node, Label, Vec3, tween } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Hud.ts (Step 8 — hearts + PayPal score)
 * Pure display: GameManager calls setLives()/setScore(). Hearts are hidden
 * left-to-right as lives are lost.
 */
@ccclass('Hud')
export class Hud extends Component {
    @property({ type: [Node], tooltip: 'Heart nodes, left to right (3)' })
    hearts: Node[] = [];

    @property({ type: Label, tooltip: 'The "$NNN" score label on the PayPal badge' })
    scoreLabel: Label = null;

    @property({ type: Node, tooltip: 'The score badge node (cash flies here, and it punches on gain)' })
    scoreBadge: Node = null;

    private _badgeScale = 0.35;

    onLoad() {
        if (this.scoreBadge) this._badgeScale = this.scoreBadge.scale.x;
    }

    setLives(n: number) {
        for (let i = 0; i < this.hearts.length; i++) {
            if (this.hearts[i]) this.hearts[i].active = i < n;
        }
    }

    setScore(value: number) {
        if (this.scoreLabel) this.scoreLabel.string = '$' + value;
    }

    /** Canvas-space position the collected cash should fly toward. */
    getScorePos(): Vec3 {
        return this.scoreBadge ? this.scoreBadge.position.clone() : new Vec3();
    }

    /** Little scale punch on the badge when score increases. */
    popScore() {
        if (!this.scoreBadge) return;
        const b = this._badgeScale;
        tween(this.scoreBadge)
            .to(0.08, { scale: new Vec3(b * 1.18, b * 1.18, 1) })
            .to(0.08, { scale: new Vec3(b, b, 1) })
            .start();
    }
}
