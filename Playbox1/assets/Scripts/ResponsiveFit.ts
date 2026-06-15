import { _decorator, Component, view, screen, ResolutionPolicy } from 'cc';
const { ccclass, property } = _decorator;

/**
 * ResponsiveFit.ts — switches the resolution policy by orientation so the game
 * always fills the screen (no black bars):
 *   landscape -> FIXED_HEIGHT (fills height, world extends sideways)
 *   portrait  -> FIXED_WIDTH  (fills width, Backdrop fills the extra top/bottom)
 * Re-applies whenever the orientation flips (e.g., device rotate / window resize).
 */
@ccclass('ResponsiveFit')
export class ResponsiveFit extends Component {
    @property({ tooltip: 'Design width used in landscape' })
    landscapeWidth = 1280;

    @property({ tooltip: 'Design width used in portrait (smaller = more zoomed-in)' })
    portraitWidth = 800;

    @property
    designHeight = 720;

    private _lastLandscape: boolean | null = null;

    onLoad() { this._apply(); }
    update() { this._apply(); }

    private _apply() {
        const s = screen.windowSize;
        const landscape = s.width >= s.height;
        if (landscape === this._lastLandscape) return; // only on change
        this._lastLandscape = landscape;
        if (landscape) {
            view.setDesignResolutionSize(this.landscapeWidth, this.designHeight, ResolutionPolicy.FIXED_HEIGHT);
        } else {
            // Smaller design width => the whole scene scales up to fill the narrow
            // portrait (everything grows together, like the reference).
            view.setDesignResolutionSize(this.portraitWidth, this.designHeight, ResolutionPolicy.FIXED_WIDTH);
        }
        const vs = view.getVisibleSize();
        console.log(`[ResponsiveFit] ${landscape ? 'LANDSCAPE' : 'PORTRAIT'} screen=${s.width | 0}x${s.height | 0} visible=${vs.width | 0}x${vs.height | 0}`);
    }
}
