import { useEffect, useState } from 'react';
import socketService from '../services/socketService';
import { SOCKET_EVENTS } from '../constants/gameConstants';

export default function useSocket(username) { // ← MOD add param
  const [players,  setPlayers ] = useState({});
  const [teamData, setTeamData] = useState({});
  const [remaining, setRemaining] = useState(0);
  const [localId,  setLocalId ] = useState(null);

  useEffect(() => {
    if (!username) return;  // ← MOD wait for user
    const stored = localStorage.getItem('playerId') || null;
    // send storedId **and** username during handshake
    const socket = socketService.connect(stored, username); 

    socket.on(SOCKET_EVENTS.INIT, d => {
      localStorage.setItem('playerId', d.playerId);
      setLocalId(d.playerId);
      setPlayers(d.players);
      setTeamData(d.teamData);
      setRemaining(d.remainingTime);
    });

    socket.on(SOCKET_EVENTS.PLAYER_JOINED, d =>
      setPlayers(p => ({ ...p, [d.playerId]: d }))
    );
    socket.on(SOCKET_EVENTS.PLAYER_LEFT, d =>
      setPlayers(p => { const np = { ...p }; delete np[d.playerId]; return np; })
    );
    socket.on(SOCKET_EVENTS.PLAYER_MOVED, d =>
      setPlayers(p => ({ ...p, [d.playerId]: d }))
    );

    socket.on(SOCKET_EVENTS.FLAG_TAKEN, d =>
      setTeamData(t => ({
        ...t,
        [d.flagTeam]: { ...t[d.flagTeam], score: d.newScore, flagLocation: null }
      }))
    );
    socket.on(SOCKET_EVENTS.FLAG_SCORED, d =>
      setTeamData(t => ({
        ...t,
        [d.scoredFlag]: {
          ...t[d.scoredFlag],
          flagLocation: { ...t[d.scoredFlag].base }
        },
        [d.playerTeam]: { ...t[d.playerTeam], score: d.teamScore }
      }))
    );
    socket.on(SOCKET_EVENTS.FLAG_PASSED, d => {
      setPlayers(prevPlayers => ({
        ...prevPlayers,
        [d.playerId]: d.player,
        [d.teammateId]: d.teammate
      }));
    });

    socket.on(SOCKET_EVENTS.TIME_SYNC, d =>
      setRemaining(d.remainingTime ?? 0)
    );
    socket.on(SOCKET_EVENTS.GAME_ENDED, d =>
      alert(`Game Over!\nWinner: ${d.winner.toUpperCase()} (${d.score} pts)`)
    );

    socket.on(SOCKET_EVENTS.PLAYER_KILLED, d => {
      setPlayers(p => {
        const np = { ...p };
        // respawn victim at base
        if (np[d.victimId]) {
          np[d.victimId] = {
            ...np[d.victimId],
            x: d.victimPos.x,
            y: d.victimPos.y,
            hasFlag: null
          };
        }
        // update killer’s flag state
        if (np[d.killerId]) {
          np[d.killerId] = {
            ...np[d.killerId],
            hasFlag: d.killerHasFlag
          };
        }
        return np;
      });

      // optional UI feedback
      if (d.victimId === localId) {
        alert(`You were killed by ${players[d.killerId].username}!`);
      } else if (d.killerId === localId) {
        alert(`You killed ${players[d.victimId].username}!`);
      }
    });    

    return () => {
      socketService.disconnect();
    };
  }, [username]); // ← MOD add dep

  return { players, teamData, remaining, localId };
}