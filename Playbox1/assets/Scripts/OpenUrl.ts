import { _decorator, Component, Node, UITransform, sys } from 'cc';
const { ccclass, property } = _decorator;

/**
 * OpenUrl.ts — makes a node clickable; opens a URL (the store page) on tap.
 * Sizes its own UITransform so the whole button area is the hit target.
 */
@ccclass('OpenUrl')
export class OpenUrl extends Component {
    @property({ tooltip: 'Store / destination URL' })
    url = 'https://play.google.com/store/apps/details?id=ae.goragaming.playoff.blocks.game.make.earn.money.rewarded';

    @property({ tooltip: 'Clickable width (px)' })
    width = 380;

    @property({ tooltip: 'Clickable height (px)' })
    height = 86;

    onLoad() {
        const ut = this.node.getComponent(UITransform) || this.addComponent(UITransform);
        // Only set a hit size if the node has none (e.g. an empty/Graphics node).
        // A Sprite already provides its own size, so don't shrink it.
        if (ut.contentSize.width < 1 || ut.contentSize.height < 1) {
            ut.setContentSize(this.width, this.height);
        }
        this.node.on(Node.EventType.TOUCH_END, this._open, this);
    }

    onDestroy() {
        this.node.off(Node.EventType.TOUCH_END, this._open, this);
    }

    private _open() {
        if (this.url) sys.openURL(this.url);
    }
}
