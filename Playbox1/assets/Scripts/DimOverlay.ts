import { _decorator, Component, Graphics, Color } from 'cc';
const { ccclass, property } = _decorator;

/**
 * DimOverlay.ts — fills the screen with a translucent dark rect (Graphics).
 * Put it as the FIRST child of the WinScreen so the gameplay behind goes dark
 * while the reward content (drawn after it) stays bright on top.
 */
@ccclass('DimOverlay')
export class DimOverlay extends Component {
    @property({ tooltip: 'Darkness, 0 (clear) - 255 (black)' })
    opacity = 165;

    onLoad() {
        const g = this.getComponent(Graphics) || this.addComponent(Graphics);
        g.clear();
        g.fillColor = new Color(0, 0, 0, this.opacity);
        g.rect(-2400, -1400, 4800, 2800); // big enough for any screen
        g.fill();
    }
}
