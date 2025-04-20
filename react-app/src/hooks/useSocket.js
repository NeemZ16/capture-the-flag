import { useEffect, useState } from 'react';
import socketService from '../services/socketService';
import { SOCKET_EVENTS } from '../constants/gameConstants';

export default function useSocket() {
  const [players,  setPlayers ] = useState({});
  const [teamData, setTeamData] = useState({});
  const [remaining, setRemaining] = useState(0);
  const [localId,  setLocalId ] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('playerId') || null;
    const socket = socketService.connect(stored);

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

    socket.on(SOCKET_EVENTS.TIME_SYNC, d =>
      setRemaining(d.remainingTime ?? 0)
    );
    socket.on(SOCKET_EVENTS.GAME_ENDED, d =>
      alert(`Game Over!\nWinner: ${d.winner.toUpperCase()} (${d.score} pts)`)
    );

    return () => {
      socketService.disconnect();
    };
  }, []);

  return { players, teamData, remaining, localId };
}