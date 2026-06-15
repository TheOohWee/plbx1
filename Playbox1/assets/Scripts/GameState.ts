/**
 * GameState.ts — tiny shared flag so the whole world can freeze together on
 * win/lose. ScrollLayer, Enemy, Bob and Player all check it; the FinishTape
 * deliberately ignores it so its snap animation still plays while frozen.
 */
export class GameState {
    static paused = false;
}
