import React, { useEffect, useState, useRef } from 'react';
import Phaser from 'phaser';
import { io } from 'socket.io-client';
import { Container, Row, Col, Button, ListGroup} from 'react-bootstrap';

export default function GamePage() {
    const [players, setPlayers] = useState({});
    const [teamData, setTeamData] = useState({});
    const [remaining, setRemaining] = useState(0);
    const [localId, setLocalId] = useState(null);
    const [started, setStarted] = useState(false); // start game

    const socketRef = useRef(null);
    const gameRef = useRef(null);

    // constants
    const GRID = 1000;      // server co‑ordinate space
    const SIZE = 600;       // canvas px
    const SCALE = SIZE / GRID;
    const COLOR = { red: 0xff0000, blue: 0x0000ff, green: 0x00ff00, magenta: 0xff00ff };

    // local cosmetic countdown
    useEffect(() => {
        const id = setInterval(() => setRemaining(t => Math.max(0, t - 1)), 1000);
        return () => clearInterval(id);
    }, []);

    // connect Socket.IO + start Phaser
    useEffect(() => {
        if (!started) return; // game doesn't work if the button clicked
        /* connect */
        const stored = localStorage.getItem('playerId');
        const socket = io('http://localhost:8000', {
            transports: ['websocket'],
            query: { existingPlayerId: stored || undefined }
        });
        socketRef.current = socket;

        // socket events
        socket.on('init', d => {
            localStorage.setItem('playerId', d.playerId);
            setLocalId(d.playerId);
            setPlayers(d.players);
            setTeamData(d.teamData);
            setRemaining(d.remainingTime);
        });

        socket.on('player_joined', d =>
            setPlayers(prev => ({ ...prev, [d.playerId]: d }))
        );
        socket.on('player_left', d =>
            setPlayers(prev => { const p = { ...prev }; delete p[d.playerId]; return p; })
        );
        socket.on('player_moved', d =>
            setPlayers(prev => ({ ...prev, [d.playerId]: d }))
        );

        /* flag stolen → hide base flag + update score */
        socket.on('flag_taken', d => {
            setTeamData(prev => ({
                ...prev,
                [d.flagTeam]: { ...prev[d.flagTeam], score: d.newScore, flagLocation: null }
            }));
        });

        /* flag scored → show flag at its base + update score */
        socket.on('flag_scored', d => {
            setTeamData(prev => ({
                ...prev,
                [d.scoredFlag]: {
                    ...prev[d.scoredFlag],
                    flagLocation: { ...prev[d.scoredFlag].base }
                },
                [d.playerTeam]: { ...prev[d.playerTeam], score: d.teamScore }
            }));
        });

        socket.on('time_sync', d => setRemaining(d.remainingTime ?? 0));
        socket.on('game_ended', d =>
            alert(`Game Over!\nWinner: ${d.winner.toUpperCase()} (${d.score} pts)`));

        // Phaser scene
        class Scene extends Phaser.Scene {
            constructor() { super('ctf'); this.avatars = {}; this.baseFlags = {}; this.cool = 0; }

            create() {
                this.add.graphics().fillStyle(0x444444, 1).fillRect(0, 0, SIZE, SIZE);
                this.cursors = this.input.keyboard.createCursorKeys();
                this.keys = this.input.keyboard.addKeys('W,A,S,D');
                this.game.canvas.setAttribute('tabindex', '0'); this.game.canvas.focus();
                window.ctfScene = this;
            }

            update(_, dt) {
                this.cool += dt; if (this.cool < 30) return; this.cool = 0;
                const sp = 5; let dx = 0, dy = 0;
                if (this.cursors.left.isDown || this.keys.A.isDown) dx -= sp;
                if (this.cursors.right.isDown || this.keys.D.isDown) dx += sp;
                if (this.cursors.up.isDown || this.keys.W.isDown) dy -= sp;
                if (this.cursors.down.isDown || this.keys.S.isDown) dy += sp;
                if ((dx || dy) && socketRef.current) socketRef.current.emit('move', { dx, dy });
            }

            // base‑flag helpers
            ensureBaseFlag(team, x, y) {
                if (this.baseFlags[team]) return;
                this.baseFlags[team] = this.add
                    .text(x, y - 18, '⚑', { fontSize: '24px', fill: '#fff' })
                    .setOrigin(0.5, 1).setTint(COLOR[team]);
            }
            hideBaseFlag(team) { this.baseFlags[team]?.destroy(); delete this.baseFlags[team]; }

            // avatar sprites
            upsertAvatar(id, data) {
                const x = data.x * SCALE, y = data.y * SCALE;

                if (this.avatars[id]) {
                    const A = this.avatars[id];
                    A.container.setPosition(x, y); A.name.setText(data.username);

                    // carry‑icon management
                    if (data.hasFlag && !A.carry) {
                        A.carry = this.add.text(0, -40, '⚑', { fontSize: '18px' })
                            .setOrigin(0.5, 1).setTint(COLOR[data.hasFlag]);
                        A.container.add(A.carry);
                    } else if (!data.hasFlag && A.carry) {
                        A.carry.destroy(); delete A.carry;
                    }
                    return;
                }

                /* new avatar */
                const body = this.add.circle(0, 0, 15, COLOR[data.team] || 0xffffff);
                const name = this.add.text(-20, -30, data.username, { fontSize: '14px', fill: '#fff' });
                const container = this.add.container(x, y, [body, name]);
                if (id === localId) {
                    const outline = this.add.circle(0, 0, 18); outline.setStrokeStyle(2, 0xffffff);
                    container.add(outline);
                }
                const avatar = { container, name };
                if (data.hasFlag) {
                    avatar.carry = this.add.text(0, -40, '⚑', { fontSize: '18px' })
                        .setOrigin(0.5, 1).setTint(COLOR[data.hasFlag]);
                    container.add(avatar.carry);
                }
                this.avatars[id] = avatar;
            }
            removeAvatar(id) { this.avatars[id]?.container.destroy(); delete this.avatars[id]; }
        }

        gameRef.current = new Phaser.Game({
            type: Phaser.AUTO, width: SIZE, height: SIZE, parent: 'phaser-container',
            physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } }, scene: Scene
        });

        /* cleanup */
        return () => { socket.disconnect(); gameRef.current?.destroy(true); };
    }, [started]);

    // React → Phaser : avatars
    useEffect(() => {
        const s = window.ctfScene; if (!s) return;
        Object.entries(players).forEach(([id, p]) => s.upsertAvatar(id, p));
        Object.keys(s.avatars).forEach(id => { if (!players[id]) s.removeAvatar(id); });
    }, [players]);

    // React → Phaser : base flags
    useEffect(() => {
        const s = window.ctfScene; if (!s) return;
        Object.entries(teamData).forEach(([team, info]) => {
            const atHome = info.flagLocation !== null;
            const bx = info.base?.x ?? 0, by = info.base?.y ?? 0;
            atHome ? s.ensureBaseFlag(team, bx * SCALE, by * SCALE) : s.hideBaseFlag(team);
        });
    }, [teamData]);

    // render UI
    const socket = socketRef.current;
    const simulateKill = () => {
        if (!socket) return;
        const id = prompt('Socket-ID to eliminate:');
        if (id) socket.emit('kill', {targetId: id.trim()});
    }

    return (
        <div>
            {/* title */}
            {!started && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: '#111',
                        color: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                    }}
                >
                    <h1 style={{ marginBottom: 30 }}>Capture&nbsp;the&nbsp;Flag</h1>
                    <button
                        className="btn btn-primary"
                        style={{ fontSize: 24, padding: '6px 40px' }}
                        onClick={() => setStarted(true)}
                    >
                        Start
                    </button>
                </div>
            )}

            {/* game */}
            {started && (
                <Container fluid style={{ padding: 20 }}>
                    <Row>
                        {/* Sidebar with stats and controls */}
                        <Col md={3} style={{ marginRight: 20 }}>
                            <h2>Game Stats</h2>
                            <p>
                                <strong>Time Left:</strong> {remaining}s
                            </p>
                            <h3>Scores</h3>
                            {Object.entries(teamData).map(([team, info]) => (
                                <p key={team}>
                                    <strong>{team.toUpperCase()}:</strong> {info.score}
                                </p>
                            ))}
                            <hr />
                            <h3>Controls</h3>
                            <ListGroup variant="flush" style={{ paddingLeft: 18 }}>
                                <ListGroup.Item>Move with WASD or arrow keys (hold).</ListGroup.Item>
                                <ListGroup.Item>Open dev‑console for live logs.</ListGroup.Item>
                            </ListGroup>
                            <Button variant="danger" size="sm" onClick={simulateKill} className="mt-2">
                                Simulate Kill
                            </Button>
                        </Col>

                        {/* Phaser game container */}
                        <Col>
                            <div
                                id="phaser-container"
                                style={{
                                    border: '2px solid #000',
                                    width: SIZE,
                                    height: SIZE,
                                }}
                            />
                        </Col>
                    </Row>
                </Container>
            )}
        </div>
    );
};

