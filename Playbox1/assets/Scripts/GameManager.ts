import { _decorator, Color, Component, Input, Label, LabelOutline, Node, Sprite, UIOpacity, UITransform, Vec3, input, tween } from 'cc';
import { Player } from './Player';
import { Enemy } from './Enemy';
import { Hud } from './Hud';
import { FinishTape } from './FinishTape';
import { GameState } from './GameState';
import { WinScreen } from './WinScreen';
import { LoseScreen } from './LoseScreen';
import { Audio } from './Audio';
const { ccclass, property } = _decorator;

/**
 * GameManager.ts (Step 7 — finite track + obstacle collision)
 * Scrolls the Track container left at the same speed as the world, and checks
 * the player against each gameplay object. Cones are cleared by jumping high
 * enough, otherwise they count as a hit. Hearts/scoring/finish come later.
 */
@ccclass('GameManager')
export class GameManager extends Component {
    @property({ type: Node, tooltip: 'Container holding gameplay objects (cones, etc.)' })
    track: Node = null;

    @property({ type: Node, tooltip: 'The Player node' })
    player: Node = null;

    @property({ tooltip: 'Track scroll speed (match the world: 300)' })
    scrollSpeed = 300;

    @property({ tooltip: 'Horizontal overlap distance that counts as a collision (px)' })
    hitRadiusX = 70;

    @property({ tooltip: 'How high above ground (px) the player must be to clear an obstacle' })
    clearHeight = 70;

    @property({ type: Hud, tooltip: 'The HUD (hearts + score)' })
    hud: Hud = null;

    @property({ type: WinScreen, tooltip: 'The WIN overlay (Congratulations + reward)' })
    winScreen: WinScreen = null;

    @property({ type: LoseScreen, tooltip: 'The LOSE overlay (FAIL + retry)' })
    loseScreen: LoseScreen = null;

    @property({ type: Node, tooltip: '"Tap to start earning!" prompt (shown until first tap)' })
    startPrompt: Node = null;

    @property({ type: Node, tooltip: '"Jump to avoid enemies" prompt (shown when she stops at the first enemy)' })
    jumpPrompt: Node = null;

    @property({ tooltip: 'Distance (px) ahead of the player at which she stops in front of the first enemy for the jump tutorial' })
    tutorialStopDistance = 360;

    @property({ type: Node, tooltip: 'Bottom-bar Download/Install button — hidden on win/lose so it does not clash with the overlay button' })
    downloadBtn: Node = null;

    @property({ type: Node, tooltip: 'Red FAIL image, flashed briefly before the lose screen' })
    failImage: Node = null;

    @property({ tooltip: 'How long the FAIL image flashes before the lose screen (sec)' })
    failSeconds = 0.7;

    @property({ tooltip: 'Starting lives' })
    lives = 3;

    @property({ tooltip: 'Min score per cash pickup' })
    cashMin = 25;

    @property({ tooltip: 'Max score per cash pickup' })
    cashMax = 60;

    @property({ tooltip: 'Horizontal reach for collecting cash (px)' })
    pickupRadiusX = 75;

    @property({ tooltip: 'Vertical reach for collecting cash (px)' })
    pickupRadiusY = 130;

    private _playerGroundY = 0;
    private _playerComp: Player = null;
    private _lives = 3;
    private _score = 0;
    private _gameOver = false;
    private _won = false;
    private _started = false;
    private _firstEnemy: Node = null;       // the enemy that triggers the jump tutorial
    private _awaitingTutorialJump = false;  // frozen in front of the first enemy, waiting for a tap
    private _tutorialDone = false;
    private _popupTexts = ['Perfect!', 'Awesome!', 'Nice!', 'Good!'];

    start() {
        if (this.player) {
            this._playerGroundY = this.player.position.y;
            this._playerComp = this.player.getComponent(Player);
        }
        this._lives = this.lives;
        this._score = 0;
        this._gameOver = false;
        this._won = false;
        this._started = false;
        this._awaitingTutorialJump = false;
        this._tutorialDone = false;
        this._firstEnemy = this._findFirstEnemy();
        GameState.paused = true; // frozen until the first tap
        this.hud?.setLives(this._lives);
        this.hud?.setScore(this._score);
        if (this.startPrompt) this.startPrompt.active = true;
        if (this.jumpPrompt) this.jumpPrompt.active = false;
        if (this.failImage) this.failImage.active = false;
        input.on(Input.EventType.TOUCH_START, this._onTap, this);
        input.on(Input.EventType.MOUSE_DOWN, this._onTap, this);
    }

    onDestroy() {
        input.off(Input.EventType.TOUCH_START, this._onTap, this);
        input.off(Input.EventType.MOUSE_DOWN, this._onTap, this);
    }

    /** The nearest enemy ahead — the one she'll reach first (smallest local x in the track). */
    private _findFirstEnemy(): Node {
        if (!this.track) return null;
        let best: Node = null;
        for (const obj of this.track.children) {
            if (!obj.getComponent(Enemy)) continue;
            if (!best || obj.position.x < best.position.x) best = obj;
        }
        return best;
    }

    private _onTap() {
        if (!this._started) {
            // First tap: start running.
            this._started = true;
            GameState.paused = false;
            Audio.i?.playBgm();
            if (this.startPrompt) this.startPrompt.active = false;
            return;
        }
        if (this._awaitingTutorialJump) {
            // Tap during the jump tutorial: resume and jump over the enemy.
            this._awaitingTutorialJump = false;
            this._tutorialDone = true;
            if (this.jumpPrompt) this.jumpPrompt.active = false;
            GameState.paused = false;
            this._playerComp?.jump();
        }
    }

    update(dt: number) {
        if (this._gameOver || !this._started) return;
        // Jump tutorial: stop her in front of the first enemy until she taps to jump.
        if (!this._tutorialDone && !this._awaitingTutorialJump && this.track && this.player && this._firstEnemy && this._firstEnemy.isValid) {
            const ex = this.track.position.x + this._firstEnemy.position.x;
            if (ex - this.player.position.x <= this.tutorialStopDistance) {
                this._awaitingTutorialJump = true;
                GameState.paused = true; // freeze the world; she holds her stance
                if (this.jumpPrompt) this.jumpPrompt.active = true;
                return;
            }
        }
        if (GameState.paused) return; // frozen (tutorial gate) — no scroll / collisions
        if (this.track) {
            this.track.setPosition(
                this.track.position.x - this.scrollSpeed * dt,
                this.track.position.y,
                this.track.position.z
            );
        }
        this._checkCollisions();
    }

    /** Hide the real cash and fly a copy of it up to the score badge, then add score. */
    private _collectCash(obj: Node) {
        const sf = obj.getComponent(Sprite)?.spriteFrame;
        const fromWorld = obj.worldPosition.clone();
        obj.active = false;

        const amount = this.cashMin + Math.floor(Math.random() * (this.cashMax - this.cashMin + 1));
        const target = this.hud?.scoreBadge;
        const hudUT = this.hud?.node.getComponent(UITransform);
        if (!this.hud || !sf || !target || !hudUT) { this._addScore(amount); return; }

        // Convert both endpoints into the HUD's local space so the path is exact,
        // no matter where the HUD / badge are nested or positioned.
        const fromLocal = hudUT.convertToNodeSpaceAR(fromWorld);
        const toLocal = hudUT.convertToNodeSpaceAR(target.worldPosition);

        const flier = new Node('CashFly');
        const sp = flier.addComponent(Sprite);
        sp.spriteFrame = sf;
        flier.setParent(this.hud.node);
        flier.setPosition(fromLocal.x, fromLocal.y, 0);
        flier.setScale(0.07, 0.07, 1);

        tween(flier)
            .to(0.45, { position: new Vec3(toLocal.x, toLocal.y, 0), scale: new Vec3(0.03, 0.03, 1) },
                { easing: 'cubicIn' })
            .call(() => {
                flier.destroy();
                this._addScore(amount);
                this.hud?.popScore();
            })
            .start();
    }

    private _addScore(amount: number) {
        this._score += amount;
        this.hud?.setScore(this._score);
    }

    /** Big white outlined "Perfect!/Nice!" message in the middle of the screen. */
    private _showPopup() {
        if (!this.hud) return;
        const txt = this._popupTexts[Math.floor(Math.random() * this._popupTexts.length)];
        const n = new Node('Popup');
        const lbl = n.addComponent(Label);
        lbl.string = txt;
        lbl.fontSize = 96;
        lbl.lineHeight = 96;
        lbl.isBold = true;
        lbl.color = new Color(255, 255, 255, 255);
        const ol = n.addComponent(LabelOutline);
        ol.color = new Color(0, 0, 0, 255);
        ol.width = 5;
        n.setParent(this.hud.node);
        n.setPosition(0, 80, 0); // centered

        const op = n.addComponent(UIOpacity);
        n.setScale(0.5, 0.5, 1);
        tween(n).to(0.16, { scale: new Vec3(1.12, 1.12, 1) }).to(0.1, { scale: new Vec3(1, 1, 1) }).start();
        tween(op).delay(0.6).to(0.3, { opacity: 0 }).call(() => n.destroy()).start();
    }

    private _loseLife() {
        this._lives = Math.max(0, this._lives - 1);
        this.hud?.setLives(this._lives);
        if (this._lives <= 0) {
            this._gameOver = true;
            GameState.paused = true; // freeze the world
            if (this.downloadBtn) this.downloadBtn.active = false;
            const finalScore = this._score;
            if (this.failImage) {
                this.failImage.active = true; // flash FAIL...
                this.scheduleOnce(() => {
                    if (this.failImage) this.failImage.active = false;
                    this.loseScreen?.show(finalScore); // ...then the lose screen
                }, this.failSeconds);
            } else {
                this.loseScreen?.show(finalScore);
            }
        }
    }

    private _checkCollisions() {
        if (!this.track || !this.player) return;
        const px = this.player.position.x;
        const py = this.player.position.y;
        const heightAboveGround = py - this._playerGroundY;

        // Win check first, so the finish frame can never also register a hazard hit.
        // Detect the finish by its FinishTape component, not its name.
        for (const obj of this.track.children) {
            if (!obj.active || (obj as any)._consumed) continue;
            const tape = obj.getComponent(FinishTape);
            if (!tape) continue;
            const fx = this.track.position.x + obj.position.x;
            if (fx <= px) {
                (obj as any)._consumed = true;
                tape.snap(1);
                this._won = true;
                this._gameOver = true;
                this._playerComp?.celebrate(); // hold celebration pose
                GameState.paused = true;       // freeze the whole world (tape still snaps)
                if (this.downloadBtn) this.downloadBtn.active = false;
                this.winScreen?.show(this._score);
                return;
            }
        }

        for (const obj of this.track.children) {
            if (!obj.active || (obj as any)._consumed || obj.getComponent(FinishTape)) continue;
            const worldX = this.track.position.x + obj.position.x; // both are Canvas-space children
            const dx = Math.abs(worldX - px);

            if (obj.name.startsWith('Cash')) {
                // Pickup: collect on x+y overlap, then remove it.
                const objY = this.track.position.y + obj.position.y;
                if (dx < this.pickupRadiusX && Math.abs(objY - py) < this.pickupRadiusY) {
                    (obj as any)._consumed = true;
                    Audio.i?.playCash();
                    this._collectCash(obj);
                }
            } else {
                // Hazard (cone / enemy): clear by jumping high enough, else take a hit.
                if (dx < this.hitRadiusX) {
                    if (heightAboveGround < this.clearHeight) {
                        (obj as any)._consumed = true; // cone stays standing, but only hits once
                        this._playerComp?.playHit();
                        Audio.i?.playHit();
                        this._loseLife();
                    } else if (!(obj as any)._dodged) {
                        (obj as any)._dodged = true;
                        this._showPopup(); // "Perfect!" / "Nice!" on a clean jump-over
                    }
                }
            }
        }
    }
}
