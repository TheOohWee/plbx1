import { _decorator, Component, Graphics, Color } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;

/**
 * GoldButton.ts — draws a one-line gold CTA pill (Graphics rounded rect with a
 * darker border + brighter face). Put a single-line Label on top for the text.
 * Runs in edit mode so it's visible while you lay it out.
 */
@ccclass('GoldButton')
@executeInEditMode(true)
export class GoldButton extends Component {
    @property({ tooltip: 'Button width (px)' })
    width = 380;

    @property({ tooltip: 'Button height (px)' })
    height = 86;

    onLoad() { this.draw(); }
    onEnable() { this.draw(); }

    draw() {
        const g = this.getComponent(Graphics) || this.addComponent(Graphics);
        const w = this.width, h = this.height, r = h / 2;
        g.clear();
        g.fillColor = new Color(176, 112, 14, 255);   // dark gold border
        g.roundRect(-w / 2, -h / 2, w, h, r); g.fill();
        const p = 7;
        g.fillColor = new Color(255, 190, 38, 255);    // bright gold face
        g.roundRect(-w / 2 + p, -h / 2 + p, w - 2 * p, h - 2 * p, r - p); g.fill();
    }
}
