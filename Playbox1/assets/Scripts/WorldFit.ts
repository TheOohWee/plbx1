import { _decorator, Component, Node, view } from 'cc';
import { Player } from './Player';
const { ccclass, property } = _decorator;

/**
 * WorldFit.ts — bottom-anchors the gameplay world so the ground line always
 * sits a fixed fraction up from the screen bottom, in BOTH orientations.
 *
 * The scene is authored centered on y=0. In landscape (design height == visible
 * height) that fills the screen. But in portrait the visible height is much
 * taller, so a centered world floats in the middle with empty bands above/below
 * — the "chopped / out of place" look. This component shifts every world layer
 * (Background, Scenery, Track) and the Player's ground baseline by one common
 * offset computed from the LIVE visible size, so it self-corrects for any aspect
 * ratio. The extra space ends up entirely ABOVE the ground (sky/trees), like the
 * reference. No reparenting: render order and GameManager refs are untouched.
 *
 * Tuning: the defaults make the offset 0 in landscape (scene unchanged). Adjust
 * `groundFromBottomFrac` live to raise/lower the ground; adjust `groundLineY`
 * only if the authored ground surface isn't at the default.
 */
@ccclass('WorldFit')
export class WorldFit extends Component {
    @property({ type: [Node], tooltip: 'World layers to vertically anchor: Background, Scenery, Track' })
    layers: Node[] = [];

    @property({ type: Node, tooltip: 'The Player node (its ground baseline is anchored too)' })
    player: Node = null;

    @property({ tooltip: 'Authored Y of the surface the player stands on (design space)' })
    groundLineY = -170;

    @property({ tooltip: 'Where the ground sits, as a fraction up from the screen bottom (0=bottom, 1=top)' })
    groundFromBottomFrac = 0.264;

    @property({ tooltip: "Player's horizontal spot as a fraction in from the LEFT edge (0=left, 1=right). Keeps her on-screen in narrow portrait." })
    playerFromLeftFrac = 0.227;

    @property({ type: Node, tooltip: 'The Scenery node (trees/lamps) — scaled up in portrait to fill the tall top. Optional.' })
    scenery: Node = null;

    @property({ tooltip: 'Extra scale applied to Scenery in portrait so trees fill the top (1 = no change)' })
    sceneryPortraitScale = 1.0;

    private _baseY: number[] = [];
    private _playerComp: Player = null;
    private _sceneryBaseScale = 1;
    private _last = '';

    onLoad() {
        for (const n of this.layers) this._baseY.push(n ? n.position.y : 0);
        if (this.player) this._playerComp = this.player.getComponent(Player);
        if (this.scenery) this._sceneryBaseScale = this.scenery.scale.x;
        this._apply();
    }

    update() {
        const vs = view.getVisibleSize();
        const k = `${vs.width | 0}x${vs.height | 0}`;
        if (k !== this._last) { this._last = k; this._apply(); }
    }

    private _apply() {
        const vs = view.getVisibleSize();
        const landscape = vs.width >= vs.height;
        // Screen Y where the ground line should land (origin = screen center).
        const targetScreenY = -vs.height / 2 + this.groundFromBottomFrac * vs.height;
        // One common offset so groundLineY (authored) maps to targetScreenY.
        const offset = targetScreenY - this.groundLineY;
        for (let i = 0; i < this.layers.length; i++) {
            const n = this.layers[i];
            if (!n) continue;
            n.setPosition(n.position.x, this._baseY[i] + offset, n.position.z);
        }
        // Keep the player anchored a fixed fraction in from the left edge so she
        // stays fully on-screen no matter how narrow the portrait view is.
        if (this.player) {
            const px = -vs.width / 2 + this.playerFromLeftFrac * vs.width;
            this.player.setPosition(px, this.player.position.y, this.player.position.z);
        }
        if (this._playerComp) this._playerComp.setGroundOffsetY(offset);
        // Scale the scenery up in portrait so trees fill the taller top area.
        if (this.scenery) {
            const s = landscape ? this._sceneryBaseScale : this._sceneryBaseScale * this.sceneryPortraitScale;
            this.scenery.setScale(s, s, this.scenery.scale.z);
        }
        console.log(`[WorldFit] visible=${vs.width | 0}x${vs.height | 0} offset=${offset | 0} landscape=${landscape}`);
    }
}
