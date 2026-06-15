import { _decorator, Component } from 'cc';
import { GameState } from './GameState';
const { ccclass, property } = _decorator;

/**
 * Bob.ts — gentle vertical levitation. Put it on cash (or any floating pickup).
 * Oscillates around the node's starting Y with a random phase so they don't
 * all bob in unison.
 */
@ccclass('Bob')
export class Bob extends Component {
    @property({ tooltip: 'How far up/down it floats (px)' })
    amplitude = 12;

    @property({ tooltip: 'Bob speed' })
    speed = 3;

    private _baseY = 0;
    private _t = Math.random() * Math.PI * 2;

    onLoad() {
        this._baseY = this.node.position.y;
    }

    update(dt: number) {
        if (GameState.paused) return;
        this._t += dt * this.speed;
        const p = this.node.position;
        this.node.setPosition(p.x, this._baseY + Math.sin(this._t) * this.amplitude, p.z);
    }
}
