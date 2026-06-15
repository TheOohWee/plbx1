import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Spin.ts — slowly rotates a node. Used on the SideEffects spotlight so the
 * light rays sweep behind the reward card. Ignores the global pause on purpose.
 */
@ccclass('Spin')
export class Spin extends Component {
    @property({ tooltip: 'Degrees per second' })
    speed = 22;

    update(dt: number) {
        this.node.angle -= this.speed * dt;
    }
}
