import { _decorator, Component, Node, UITransform, view } from 'cc';
import { GameState } from './GameState';
const { ccclass, property } = _decorator;

/**
 * ScrollLayer.ts (Step 5 — infinite horizontal scroll)
 * Scrolls all child tiles leftward; when a tile moves fully off the left edge,
 * it is recycled to the right of the current rightmost tile. Screen-width aware,
 * so it never gaps on wide screens (just add enough tiles to cover the view + 1).
 */
@ccclass('ScrollLayer')
export class ScrollLayer extends Component {
    @property({ tooltip: 'Leftward scroll speed (px/sec)' })
    speed = 300;

    @property({ tooltip: 'Width of one tile. 0 = auto from the first child' })
    tileWidth = 0;

    @property({ tooltip: 'Flip every other tile so identical edges meet (kills the seam)' })
    mirrorAlternate = true;

    private _tiles: Node[] = [];
    private _w = 0;

    onLoad() {
        this._tiles = this.node.children.slice();
        if (this._tiles.length === 0) return;
        if (this.tileWidth > 0) {
            this._w = this.tileWidth;
        } else {
            const ut = this._tiles[0].getComponent(UITransform);
            this._w = ut ? ut.contentSize.width * Math.abs(this._tiles[0].scale.x) : 0;
        }
    }

    update(dt: number) {
        if (GameState.paused) return;
        if (this._tiles.length === 0 || this._w <= 0) return;
        const dx = this.speed * dt;
        const halfView = view.getVisibleSize().width / 2;
        const offLeft = -halfView - this._w / 2; // a tile is fully off-screen left past this

        let rightX = -Infinity;
        for (const t of this._tiles) {
            const x = t.position.x - dx;
            t.setPosition(x, t.position.y, t.position.z);
            if (x > rightX) rightX = x;
        }
        for (const t of this._tiles) {
            if (t.position.x < offLeft) {
                rightX += this._w;
                t.setPosition(rightX, t.position.y, t.position.z);
            }
        }

        // Mirror every other slot so adjacent tiles share an identical edge -> no seam.
        if (this.mirrorAlternate) {
            for (const t of this._tiles) {
                const slot = Math.round(t.position.x / this._w);
                const sign = (Math.abs(slot) % 2 === 1) ? -1 : 1;
                const sx = Math.abs(t.scale.x) * sign;
                if (t.scale.x !== sx) t.setScale(sx, t.scale.y, t.scale.z);
            }
        }
    }
}
