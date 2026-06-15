import { _decorator, Component, Node, view } from 'cc';
const { ccclass, property } = _decorator;

/**
 * SceneryFit.ts — put on the Scenery node. In portrait it scales the scenery
 * sprites up and raises them so the trees/lamps fill the tall upper area (like
 * the reference); in landscape it uses their original size. Scales each child
 * individually so ScrollLayer's horizontal wrap is unaffected.
 */
@ccclass('SceneryFit')
export class SceneryFit extends Component {
    @property({ tooltip: 'Extra scale multiplier applied to scenery in portrait' })
    portraitScale = 1.8;

    @property({ tooltip: 'Raise scenery by this much in portrait (px)' })
    portraitYOffset = 160;

    private _base: { node: Node; scale: number; y: number }[] = [];
    private _last: boolean | null = null;

    onLoad() {
        for (const c of this.node.children) {
            this._base.push({ node: c, scale: c.scale.x, y: c.position.y });
        }
        console.log(`[SceneryFit] onLoad: found ${this._base.length} scenery children`);
        this._apply();
    }

    update() {
        const landscape = this._isLandscape();
        if (landscape !== this._last) { this._last = landscape; this._apply(); }
    }

    private _isLandscape(): boolean {
        const s = view.getVisibleSize();
        return s.width >= s.height;
    }

    private _apply() {
        const landscape = this._isLandscape();
        const s = view.getVisibleSize();
        console.log(`[SceneryFit] apply: visible=${s.width | 0}x${s.height | 0} -> ${landscape ? 'LANDSCAPE' : 'PORTRAIT'} (${this._base.length} children)`);
        for (const b of this._base) {
            const s = landscape ? b.scale : b.scale * this.portraitScale;
            b.node.setScale(s, s, b.node.scale.z);
            const y = landscape ? b.y : b.y + this.portraitYOffset;
            b.node.setPosition(b.node.position.x, y, b.node.position.z);
        }
    }
}
