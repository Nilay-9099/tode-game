// TODE AND THE LAST LILYPAD - Game State Machine (Spec Section 4.3)
// Enforces clear global states and run substates.

export const GAME_STATES = {
  BOOT: 'BOOT',
  TITLE: 'TITLE',
  TUTORIAL: 'TUTORIAL',
  RUN: 'RUN',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
  VICTORY: 'VICTORY',
};

export const RUN_SUBSTATES = {
  INTERMISSION: 'INTERMISSION',
  PERK_DRAFT: 'PERK_DRAFT',
  COMBAT: 'COMBAT',
  BOSS: 'BOSS',
  WAVE_CLEAR: 'WAVE_CLEAR',
};

export class GameStateMachine {
  constructor(initialState = GAME_STATES.RUN) {
    this.currentState = initialState;
    this.currentSubstate = RUN_SUBSTATES.COMBAT;
    this.previousState = null;
    this.timeScale = 1.0;
    this.listeners = new Set();
  }

  onTransition(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  setState(newState, substate = null) {
    if (this.currentState === newState && (!substate || this.currentSubstate === substate)) {
      return;
    }

    const oldState = this.currentState;
    const oldSubstate = this.currentSubstate;

    this.previousState = oldState;
    this.currentState = newState;
    if (substate) {
      this.currentSubstate = substate;
    }

    // Time scale adjustments for states
    if (newState === GAME_STATES.PAUSED) {
      this.timeScale = 0.0;
    } else if (oldState === GAME_STATES.PAUSED) {
      this.timeScale = 1.0;
    }

    for (const listener of this.listeners) {
      try {
        listener({
          from: oldState,
          to: newState,
          substate: this.currentSubstate,
          oldSubstate,
        });
      } catch (err) {
        console.error('[StateMachine] Transition error:', err);
      }
    }
  }

  setSubstate(newSubstate) {
    this.setState(this.currentState, newSubstate);
  }

  isSimActive() {
    return (
      (this.currentState === GAME_STATES.RUN || this.currentState === GAME_STATES.TUTORIAL) &&
      this.currentSubstate !== RUN_SUBSTATES.PERK_DRAFT &&
      this.timeScale > 0
    );
  }

  togglePause() {
    if (this.currentState === GAME_STATES.PAUSED) {
      this.setState(this.previousState || GAME_STATES.RUN);
      return false;
    } else if (this.currentState === GAME_STATES.RUN || this.currentState === GAME_STATES.TUTORIAL) {
      this.setState(GAME_STATES.PAUSED);
      return true;
    }
    return false;
  }
}

export const gameState = new GameStateMachine(GAME_STATES.RUN);
