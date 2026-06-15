import { _decorator, Component, Graphics, Color } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;

/**
 * Backdrop.ts — fills the area BEHIND the scrolling BG with the BG's own edge
 * colors (pink sky above, green grass below) so that in portrait the extra
 * vertical space is filled seamlessly instead of showing black bars.
 * Put it as the first child of Canvas (behind Background).
 */
@ccclass('Backdrop')
@executeInEditMode(true)
export class Backdrop extends Component {
    @property({ tooltip: 'Sky color (matches BG top)' })
    sky: Color = new Color(249, 228, 226, 255);

    @property({ tooltip: 'Ground color (matches BG bottom)' })
    ground: Color = new Color(173, 186, 93, 255);

    @property({ tooltip: 'Y where the BG bottom sits (ground starts below this)' })
    groundTopY = -360;

    onLoad() { this.draw(); }
    onEnable() { this.draw(); }

    draw() {
        const g = this.getComponent(Graphics) || this.addComponent(Graphics);
        g.clear();
        // Pink sky everywhere...
        g.fillColor = this.sky;
        g.rect(-5000, -5000, 10000, 10000); g.fill();
        // ...then green ground from far below up to the BG's bottom edge.
        g.fillColor = this.ground;
        g.rect(-5000, -5000, 10000, 5000 + this.groundTopY); g.fill();
    }
}
