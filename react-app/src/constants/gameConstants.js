//shared game constants and event names
export const GRID    = 1000;      // server co‑ordinate space
export const SIZE    = 600;       // canvas px
export const SCALE   = SIZE / GRID;
export const COLOR   = {
  red:     0xff0000,
  blue:    0x0000ff,
  green:   0x00ff00,
  magenta: 0xff00ff
};

export const SOCKET_EVENTS = {
  INIT:         'init',
  PLAYER_JOINED:'player_joined',
  PLAYER_LEFT:  'player_left',
  PLAYER_MOVED: 'player_moved',
  FLAG_TAKEN:   'flag_taken',
  FLAG_SCORED:  'flag_scored',
  TIME_SYNC:    'time_sync',
  GAME_ENDED:   'game_ended',
  MOVE:         'move',
  KILL:         'kill',
  GAME_DESTROYED: 'game_destroyed',
};