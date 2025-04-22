import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { startGame } from '../phaser';
import useSocket from '../hooks/useSocket';
import useCountdown from '../hooks/useCountdown';
import GameSidebar from '../components/GameSidebar';
import socketService from '../services/socketService';
import { SOCKET_EVENTS, SCALE } from '../constants/gameConstants';

export default function GamePage({ username, setUsername }) {
    const [started, setStarted] = useState(false);
    const { players, teamData, remaining: syncedRemaining, localId } = useSocket(username); 
    const [remaining, setRemaining] = useCountdown(syncedRemaining);
    const navigate = useNavigate();
    const phaserRef = useRef();

    // keeps the countdown in sync
    useEffect(() => {
        setRemaining(syncedRemaining);
    }, [syncedRemaining, setRemaining]);

    //starts the Phaser game with initial state
    useEffect(() => {
        let pollTimer;

        if (started) {
            phaserRef.current = startGame('phaser-container');

            pollTimer = setInterval(() => {
                const scene = window.ctfScene;
                if (!scene) return;

                // inject avatars
                Object.entries(players).forEach(([id, p]) =>
                    scene.upsertAvatar(id, p, localId)
                );
                // inject flags
                Object.entries(teamData).forEach(([team, info]) => {
                    const atHome = info.flagLocation !== null;
                    const bx = info.base?.x ?? 0;
                    const by = info.base?.y ?? 0;
                    if (atHome) scene.ensureBaseFlag(team, bx * SCALE, by * SCALE);
                    else scene.hideBaseFlag(team);
                });

                clearInterval(pollTimer);
            }, 50);
        }

        return () => {
            phaserRef.current?.destroy(true);
            window.ctfScene = null;
            if (pollTimer) clearInterval(pollTimer);
        };

        // DONT DELETE COMMENT BELOW will get unnecesary warnings
        // eslint-disable-next-line
    }, [started]);

    // listen for the server telling us the round was nuked
    // needs more testing below
    useEffect(() => {
        const sock = socketService.socket  // reuse the single connection
        if (!sock) return

        const onDestroyed = () => {
            phaserRef.current?.destroy(true)
            window.ctfScene = null
            setStarted(false)
            localStorage.removeItem('playerId')
        }

        sock.on(SOCKET_EVENTS.GAME_DESTROYED, onDestroyed)
        return () => {
            sock.off(SOCKET_EVENTS.GAME_DESTROYED, onDestroyed)
        }
    }, [setStarted])


    // continuous avatar updates
    useEffect(() => {
        const scene = window.ctfScene;
        if (!scene) return;

        Object.entries(players).forEach(([id, p]) =>
            scene.upsertAvatar(id, p, localId)
        )
        Object.keys(scene.avatars).forEach(id => {
            if (!players[id]) scene.removeAvatar(id)
        })

    }, [players, localId]);

    // continuous base flag updates
    useEffect(() => {
        const scene = window.ctfScene;
        if (!scene) return;

        Object.entries(teamData).forEach(([team, info]) => {
            const atHome = info.flagLocation !== null
            const bx = info.base?.x ?? 0
            const by = info.base?.y ?? 0
            if (atHome) scene.ensureBaseFlag(team, bx * SCALE, by * SCALE)
            else scene.hideBaseFlag(team)
        })
    }, [teamData]);

    const simulateKill = () => {
        const id = prompt('Socket‑ID to eliminate:');
        if (id) socketService.emit(SOCKET_EVENTS.KILL, { targetId: id.trim() });
    };

    const handleLogout = async () => {

        const endpoint = 'http://localhost:8000/logout'

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                credentials: 'include', //will send the auth_token cookie so backend can clear it
                redirect: 'manual',
            });


            if (response.ok) { //backend returns plain text
                //successful logout
                //currently, once username is empty logout button wont show

                setUsername('');

                navigate('/');

            } else if (response.status === 400) { //cookie deleted in backend
                const msg = await response.text();

                console.warn(msg);
                setUsername('');
            } else {
                const msg = await response.text();

                console.warn('Logout failed', response.status, msg);
            }
        } catch (err) {
            console.error('Logout error', err);
        }
    }

    return (
        <div>
            {!started
                ? <div className="start-overlay">
                    <h1>Capture the Flag</h1>
                    <button onClick={() => setStarted(true)}>Start</button>
                </div>
                : <Container fluid>
                    <Row>
                        <Col md={3}>
                            <GameSidebar
                                username={username}
                                onLogout={handleLogout}
                                players={players}
                                teamData={teamData}
                                remaining={remaining}
                                onSimulateKill={simulateKill}
                            />
                        </Col>
                        <Col>
                            <div id="phaser-container" style={{ border: '2px solid #000' }} />
                        </Col>
                    </Row>
                </Container>
            }
        </div>
    );
}