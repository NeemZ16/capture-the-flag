import React, { useEffect, useState } from 'react';
import Phaser from 'phaser';
import { io } from 'socket.io-client';
import { Container, Row, Col, Button} from 'react-bootstrap';

const GamePage = () => {
    const [socket, setSocket] = useState(null);

    // Game state
    const [players, setPlayers] = useState({});
    const [localPlayerId, setLocalPlayerId] = useState(null);
    const [teamData, setTeamData] = useState({});
    const [remainingTime, setRemainingTime] = useState(0);

    // We'll scale server coords (0..1000) into 600×600
    const scaleFactor = 0.6;

    // (Optional) local countdown so we can see the time
    useEffect(() => {
        const timer = setInterval(() => {
            setRemainingTime(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Connect to server + create Phaser once
    useEffect(() => {
        // 1) Try reusing the same playerId from localStorage
        const existingId = localStorage.getItem('playerId');
        console.log('[GamePage] existingId from localStorage:', existingId);

        const s = io('http://localhost:8000', {
            transports: ['websocket'],
            query: { existingPlayerId: existingId },
        });
        setSocket(s);

        s.on('connect', () => {
            console.log('[socket connect] New socket ID:', s.id);
        });

        s.on('disconnect', () => {
            console.log('[socket disconnect] Lost connection to server.');
        });

        // Initial game state
        s.on('init', data => {
            console.log('[init] from server:', data);
            localStorage.setItem('playerId', data.playerId); // store ID for refresh
            setLocalPlayerId(data.playerId);
            setPlayers(data.players);
            setTeamData(data.teamData);
            setRemainingTime(data.remainingTime);
        });

        s.on('player_joined', data => {
            console.log('[player_joined] from server:', data);
            setPlayers(prev => ({ ...prev, [data.playerId]: data }));
        });

        s.on('player_left', data => {
            console.log('[player_left] from server:', data);
            setPlayers(prev => {
                const copy = { ...prev };
                delete copy[data.playerId];
                return copy;
            });
        });

        // Position/flag updates
        s.on('player_moved', data => {
            console.log('[player_moved] from server:', data);
            setPlayers(prev => ({ ...prev, [data.playerId]: data }));
        });

        s.on('flag_taken', data => {
            console.log('[flag_taken] from server:', data);
            if (data.newScore !== undefined && data.flagTeam) {
                setTeamData(prev => ({
                    ...prev,
                    [data.flagTeam]: {
                        ...prev[data.flagTeam],
                        score: data.newScore
                    }
                }));
            }
        });

        s.on('flag_scored', data => {
            console.log('[flag_scored] from server:', data);
            if (data.teamScore !== undefined && data.playerTeam) {
                setTeamData(prev => ({
                    ...prev,
                    [data.playerTeam]: {
                        ...prev[data.playerTeam],
                        score: data.teamScore
                    }
                }));
            }
        });

        s.on('time_sync', data => {
            console.log('[time_sync] from server:', data);
            if (data.remainingTime !== undefined) {
                setRemainingTime(data.remainingTime);
            }
        });

        s.on('game_ended', data => {
            console.log('[game_ended] from server:', data);
            alert(`Game Over! Winner: ${data.winner.toUpperCase()} with ${data.score} points.`);
        });

        // Phaser Scene
        class CaptureTheFlagScene extends Phaser.Scene {
            constructor() {
                super('CaptureTheFlagScene');
                this.remotePlayers = {};
                this.moveCooldown = 0;
            }

            create() {
                // 600×600 background
                const bg = this.add.graphics();
                bg.fillStyle(0x444444, 1);
                bg.fillRect(0, 0, 600, 600);

                // Keyboard controls
                this.cursors = this.input.keyboard.createCursorKeys();
                this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
                this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
                this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
                this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

                // Make canvas focusable + focus it
                this.game.canvas.setAttribute('tabindex', '0');
                this.game.canvas.focus();

                // Extra debug: log raw keydown
                this.input.keyboard.on('keydown', (evt) => {
                    console.log('[Phaser keydown]', evt.key);
                });

                window.sceneRef = { current: this };
            }

            update(time, delta) {
                // Poll for movement more frequently than 100ms. Let's do 30ms
                this.moveCooldown += delta;
                if (this.moveCooldown < 30) return;
                this.moveCooldown = 0;

                let dx = 0, dy = 0;
                const speed = 5;

                // Check arrows
                if (this.cursors.left.isDown) dx -= speed;
                if (this.cursors.right.isDown) dx += speed;
                if (this.cursors.up.isDown) dy -= speed;
                if (this.cursors.down.isDown) dy += speed;
                // Check WASD
                if (this.aKey.isDown) dx -= speed;
                if (this.dKey.isDown) dx += speed;
                if (this.wKey.isDown) dy -= speed;
                if (this.sKey.isDown) dy += speed;

                // If there's movement, emit 'move'
                if ((dx !== 0 || dy !== 0) && socket) {
                    console.log(`[Phaser update] Attempting move dx=${dx}, dy=${dy}`);
                    socket.emit('move', { dx, dy });
                }
            }

            updateOrCreatePlayer(socketId, data) {
                const x = data.x * scaleFactor;
                const y = data.y * scaleFactor;

                if (this.remotePlayers[socketId]) {
                    // Update existing
                    const rp = this.remotePlayers[socketId];
                    rp.container.x = x;
                    rp.container.y = y;
                    rp.nameText.setText(data.username);
                } else {
                    // Color by team
                    let color = 0xffffff;
                    switch (data.team) {
                        case 'red': color = 0xff0000; break;
                        case 'blue': color = 0x0000ff; break;
                        case 'green': color = 0x00ff00; break;
                        case 'magenta': color = 0xff00ff; break;
                        default: break;
                    }
                    const circle = this.add.circle(0, 0, 15, color);
                    const nameText = this.add.text(-20, -30, data.username, {
                        fontSize: '14px',
                        fill: '#ffffff'
                    });
                    const container = this.add.container(x, y, [circle, nameText]);

                    // White outline for local player
                    if (socketId === localPlayerId) {
                        const outline = this.add.circle(0, 0, 18);
                        outline.setStrokeStyle(2, 0xffffff);
                        container.addAt(outline, 0);
                    }

                    this.remotePlayers[socketId] = { container, nameText };
                }
            }

            removePlayer(socketId) {
                if (this.remotePlayers[socketId]) {
                    this.remotePlayers[socketId].container.destroy();
                    delete this.remotePlayers[socketId];
                }
            }
        }

        // Create Phaser game
        const config = {
            type: Phaser.AUTO,
            width: 600,
            height: 600,
            parent: 'phaser-container',
            physics: {
                default: 'arcade',
                arcade: { debug: false, gravity: { y: 0 } }
            },
            scene: CaptureTheFlagScene
        };
        const game = new Phaser.Game(config);

        // Cleanup on unmount
        return () => {
            game.destroy(true);
            s.disconnect();
        };
    }, []);

    // Whenever `players` changes, update the Phaser scene
    useEffect(() => {
        if (!window.sceneRef?.current) return;
        const scene = window.sceneRef.current;

        for (const [pid, pdata] of Object.entries(players)) {
            scene.updateOrCreatePlayer(pid, pdata);
        }

        // Remove any that disappeared
        const sceneIds = Object.keys(scene.remotePlayers);
        for (const sid of sceneIds) {
            if (!players[sid]) {
                scene.removePlayer(sid);
            }
        }
    }, [players]);

    const handleKill = () => {
        if (socket) {
            const targetId = prompt("Enter target's socket ID to kill:");
            if (targetId) {
                socket.emit('kill', { targetId });
            }
        }
    }



  return (
    <Container fluid className="py-4">
      <Row>
        {/* LEFT PANEL: Game Stats and Instructions */}
        <Col md={4}>
          <h2>Game Stats</h2>
          <p>
            <strong>Time Remaining:</strong> {remainingTime} s
          </p>
          <h3>Team Scores:</h3>
          {Object.keys(teamData).map(team => (
            <p key={team}>
              <strong>{team.toUpperCase()}:</strong> {teamData[team].score}
            </p>
          ))}
          <hr />
          <h3>Instructions</h3>
          <ul>
            <li>Hold Arrows or WASD a bit (tapping might be missed).</li>
            <li>Open browser console for debug logs.</li>
          </ul>
          <Button variant="danger" onClick={handleKill}>
            Kill someone
          </Button>
        </Col>

        {/* RIGHT PANEL: Phaser Container */}
        <Col md={8}>
          <div
            id="phaser-container"
            style={{ border: '2px solid #000', outline: 'none', height: '500px' }}
          >
            {/* Phaser game will appear here */}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default GamePage;