import { _decorator, Component, UITransform, view, Enum } from 'cc';
const { ccclass, property } = _decorator;

/** Which edge/corner this node sticks to. */
enum Edge { TOP_LEFT, TOP_RIGHT, TOP_CENTER, BOTTOM_LEFT, BOTTOM_RIGHT, BOTTOM_CENTER, CENTER, CENTER_LEFT, CENTER_RIGHT }

/**
 * Anchor.ts — pins a node to an edge/corner, recomputing on resize/rotate.
 * By default it anchors to the live screen viewport. Set `relativeToParent` to
 * anchor to the PARENT node's rect instead — that lets you group UI (e.g. a
 * full-width bottom bar) and have children stick to the bar's edges, so the
 * whole group moves/resizes together while staying responsive.
 */
@ccclass('Anchor')
export class Anchor extends Component {
    @property({ type: Enum(Edge), tooltip: 'Edge/corner to stick to' })
    edge = Edge.TOP_LEFT;

    @property({ tooltip: 'Horizontal inset from the edge (px)' })
    marginX = 40;

    @property({ tooltip: 'Vertical inset from the edge (px)' })
    marginY = 40;

    @property({ tooltip: 'Stretch width to fill the viewport/parent (e.g. the bottom bar)' })
    stretchWidth = false;

    @property({ tooltip: "Anchor to the PARENT node's rect instead of the screen (for grouped UI)" })
    relativeToParent = false;

    private _last = '';

    onLoad() { this._apply(); }

    update() {
        const vs = view.getVisibleSize();
        // Key on both the screen size and (in parent mode) the parent's size, so
        // a node re-anchors when its full-width parent resizes too.
        let k = `${vs.width | 0}x${vs.height | 0}`;
        if (this.relativeToParent) {
            const put = this.node.parent?.getComponent(UITransform);
            if (put) k += `|${put.contentSize.width | 0}x${put.contentSize.height | 0}`;
        }
        if (k !== this._last) { this._last = k; this._apply(); }
    }

    private _apply() {
        // Rect edges in this node's local space (i.e. its parent's coordinate frame).
        let left: number, right: number, top: number, bottom: number, fullWidth: number;
        const put = this.relativeToParent ? this.node.parent?.getComponent(UITransform) : null;
        if (put) {
            const w = put.contentSize.width, h = put.contentSize.height;
            const ax = put.anchorPoint.x, ay = put.anchorPoint.y;
            left = -ax * w; right = (1 - ax) * w;
            bottom = -ay * h; top = (1 - ay) * h;
            fullWidth = w;
        } else {
            const vs = view.getVisibleSize();
            left = -vs.width / 2; right = vs.width / 2;
            bottom = -vs.height / 2; top = vs.height / 2;
            fullWidth = vs.width;
        }
        const cx = (left + right) / 2, cy = (top + bottom) / 2;
        let x = cx, y = cy;
        switch (this.edge) {
            case Edge.TOP_LEFT: x = left + this.marginX; y = top - this.marginY; break;
            case Edge.TOP_RIGHT: x = right - this.marginX; y = top - this.marginY; break;
            case Edge.TOP_CENTER: x = cx; y = top - this.marginY; break;
            case Edge.BOTTOM_LEFT: x = left + this.marginX; y = bottom + this.marginY; break;
            case Edge.BOTTOM_RIGHT: x = right - this.marginX; y = bottom + this.marginY; break;
            case Edge.BOTTOM_CENTER: x = cx; y = bottom + this.marginY; break;
            case Edge.CENTER_LEFT: x = left + this.marginX; y = cy + this.marginY; break;
            case Edge.CENTER_RIGHT: x = right - this.marginX; y = cy + this.marginY; break;
            case Edge.CENTER: x = cx + this.marginX; y = cy + this.marginY; break;
        }
        this.node.setPosition(x, y, this.node.position.z);
        if (this.stretchWidth) {
            const ut = this.node.getComponent(UITransform);
            if (ut) ut.setContentSize(fullWidth, ut.contentSize.height);
        }
    }
}
