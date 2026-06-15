import { _decorator, Component, Graphics, Color, view } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;

/**
 * ColorFill.ts — draws a solid color rectangle that spans the full screen width
 * (and a fixed height), redrawing on resize/rotate. Use it as the background of
 * the bottom bar: the PayPal footer image sits on top at a fixed size on one
 * side, and this fill covers the rest of the width with a matching color, so the
 * bar looks right in both portrait and landscape without stretching the image.
 *
 * Put it on a node that is the FIRST child of BottomBar (so it draws behind the
 * footer image), positioned at local (0,0).
 */
@ccclass('ColorFill')
@executeInEditMode(true)
export class ColorFill extends Component {
    @property({ tooltip: 'Fill color — defaults to the footer purple (149,85,255); eyedrop to fine-tune' })
    color: Color = new Color(149, 85, 255, 255);

    @property({ tooltip: 'Bar height (px)' })
    height = 238;

    @property({ tooltip: 'Extra width beyond the screen so edges never gap (px)' })
    overscan = 8;

    private _last = '';

    onLoad() { this._draw(); }
    onEnable() { this._draw(); }

    update() {
        const k = `${view.getVisibleSize().width | 0}`;
        if (k !== this._last) { this._last = k; this._draw(); }
    }

    private _draw() {
        const g = this.getComponent(Graphics) || this.addComponent(Graphics);
        const w = view.getVisibleSize().width + this.overscan * 2;
        const h = this.height;
        g.clear();
        g.fillColor = this.color;
        g.rect(-w / 2, -h / 2, w, h);
        g.fill();
    }
}
