import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Button, ListGroup } from 'react-bootstrap';
import { useNavigate }         from 'react-router-dom';
import { startGame }           from '../phaser';
import useSocket               from '../hooks/useSocket';
import useCountdown            from '../hooks/useCountdown';
import GameSidebar             from '../components/GameSidebar';
import socketService           from '../services/socketService';
import { SOCKET_EVENTS }       from '../constants/gameConstants';
import { SCALE }               from '../constants/gameConstants';

export default function GamePage({ username, setUsername }) {
    const [started, setStarted] = useState(false);
    const { players, teamData, remaining: syncedRemaining, localId } = useSocket();
    const [remaining, setRemaining] = useCountdown(syncedRemaining);
    const navigate = useNavigate();
    const phaserRef = useRef();

    // sync the initial remaining into our countdown hook
    useEffect(() => { setRemaining(syncedRemaining) }, [syncedRemaining]);

    useEffect(() => {
        if (started) {
            phaserRef.current = startGame('phaser-container');
        }
        return () => phaserRef.current?.destroy(true);
    }, [started]);


    // React → Phaser: update avatars whenever `players` changes
    useEffect(() => {
        const scene = window.ctfScene;
        if (!scene) return;

        // add / update
        Object.entries(players).forEach(([id, p]) =>
            scene.upsertAvatar(id, p, localId)
        );

        // remove
        Object.keys(scene.avatars).forEach(id => {
            if (!players[id]) scene.removeAvatar(id);
        });
    }, [players, localId]);

    // React → Phaser: update base‐flag graphics whenever `teamData` changes
    useEffect(() => {
        const scene = window.ctfScene;

        if (!scene) return;
        Object.entries(teamData).forEach(([team, info]) => {
            const atHome = info.flagLocation !== null;
            const bx = info.base?.x ?? 0;
            const by = info.base?.y ?? 0;
            
            if (atHome) scene.ensureBaseFlag(team, bx * SCALE, by * SCALE);
            else       scene.hideBaseFlag(team);
        });
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

            setUsername('')

            navigate('/')

        } else if(response.status === 400) { //cookie deleted in backend
            const msg = await response.text();

            console.warn(msg)
            setUsername('')
        }else {
            const msg = await response.text();

            console.warn('Logout failed', response.status, msg);
        }
        } catch (err) {
        console.error('Logout error', err)
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