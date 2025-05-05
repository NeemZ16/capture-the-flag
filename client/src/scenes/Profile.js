import { BaseScene } from './BaseScene';

export class Profile extends BaseScene {
    constructor() {
        super('Profile');
    }

    async fetchPlayerStats(username) {
        const url = import.meta.env.VITE_API_URL + "stats/" + username;
        try {
            const response = await fetch(url, {
                method: "GET",
                credentials: "include"
            });
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const stats = await response.json();
            this.updatePlayerStatsUI(stats);

            return stats;
        } catch (error) {
            console.error("Error fetching player stats: ", error)
        }
    }

    async fetchLeaderboard() {
        const url = import.meta.env.VITE_API_URL + "leaderboard";
        try {
            const response = await fetch(url, {
                method: "GET",
                credentials: "include"
            });
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            const leaderboard = await response.json()
            console.log(leaderboard)
            return leaderboard
        } catch (error) {
            console.error("Error fetching player stats: ", error)
        }
    }

    updatePlayerStatsUI(stats) {
        document.querySelector("#kills .value").innerText = stats.kills
        document.querySelector("#steals .value").innerText = stats.steals
        document.querySelector("#scored .value").innerText = stats.flags_scored
    }

    getProfileImg() {
        fetch(import.meta.env.VITE_API_URL + "profile", {
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => {
                if (!data || !data.avatarUrl) return;
                let url = data.avatarUrl;
                if (url.startsWith('/')) {
                    url = url.slice(1);
                }
                this.game.userImg = import.meta.env.VITE_API_URL + url;
                const pfp = document.getElementById('profileImg');
                pfp.src = this.game.userImg;
            })
            .catch((err) => console.error(err));
    }

    uploadProfileImg(file) {
        const formData = new FormData();
        formData.append('avatar', file);

        fetch(import.meta.env.VITE_API_URL + "avatar", {
            method: 'POST',
            body: formData,
            credentials: 'include'
        })
            .then(res => {
                if (!res.ok) {
                    return res.text().then(txt => {
                        this.setMessage(txt);
                        throw new Error(txt); // to stop further .then()
                    });
                }
                return res.json();
            })
            .then(data => {
                const { avatarUrl: newUrl } = data;
                this.setAvatarUrl(newUrl);
            })
            .catch(() => {
                this.setMessage("Upload failed");
            });
    }

    setAvatarUrl(url) {
        if (url.startsWith('/')) {
            url = url.slice(1);
        }
        this.game.userImg = import.meta.env.VITE_API_URL + url;
        const pfp = document.getElementById('profileImg');
        pfp.src = this.game.userImg;
    }

    setMessage(message) {
        const msgEl = document.getElementById('uploadMsg');
        if (!msgEl) return;

        msgEl.textContent = message;
        msgEl.style.display = 'inline';

        // hide after 3 seconds
        setTimeout(() => {
            msgEl.textContent = '';
            msgEl.style.display = 'none';
        }, 3000);
    }

    handleLogout() {
        const url = import.meta.env.VITE_API_URL + "logout";
        fetch(url, {
            method: 'POST',
            credentials: 'include',
        })
            .then((res) => res.text().then((text) => ({ status: res.status, text })))
            .then(({ status, text }) => {
                // reset username and reload should go to main menu
                this.game.username = null;
                window.location.reload();
            })
    }

    async create() {
        document.getElementById('profile-wrapper').style.display = 'block';
        document.getElementById('startGame').onclick = () => {
            document.getElementById('profile-wrapper').style.display = 'none';
            this.scene.start('Game');
        };
        document.getElementById('welcomeText').innerText = `hi ${this.game.username}!`;
        document.getElementById('username').innerText = this.game.username;

        // Fetch player stats & leaderboard asynchronously
        const playerStats = await this.fetchPlayerStats(this.game.username);
        const leaderboard = await this.fetchLeaderboard();

        if (!playerStats || !leaderboard) {
            console.error("Failed to fetch player stats or leaderboard.");
            return;
        }

        // Select achievements container
        const achievementsContainer = document.querySelector('.achievements');
        const leaderboardContainer = document.querySelector('.leaderboard');

        // Display Achievements
        const achievements = [
            { title: "First Blood", description: "Get your first kill.", progress: playerStats.kills || 0, max: 1 },
            { title: "Flag Master", description: "Capture 5 flags.", progress: playerStats.flags_scored || 0, max: 5 },
            { title: "Master Ninja", description: "Steal 10 flags from enemies.", progress: playerStats.steals || 0, max: 10 }
        ];
        achievementsContainer.innerHTML = "<h2>Achievements</h2>";
        achievements.forEach(achievement => {
            const achElement = document.createElement('div');
            achElement.classList.add('achievement-card');
            achElement.innerHTML = `
                <strong>${achievement.title}</strong><br>
                <p>${achievement.description}</p>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${(achievement.progress / achievement.max) * 100}%"></div>
                </div>
                <p>${achievement.progress} / ${achievement.max}</p>
            `;
            achievementsContainer.appendChild(achElement);
        });

        document.getElementById('logout').onclick = () => {
            this.handleLogout();
        }

        this.getProfileImg();
        // Display Leaderboard
        leaderboardContainer.innerHTML = "<h2>Leaderboard</h2>";

        leaderboard.players.forEach((player, index) => {
            const leaderboardItem = document.createElement('div');
            leaderboardItem.classList.add('leaderboard-entry');
            leaderboardItem.innerHTML = `
            <div class="player-card">
                <p><strong>${index + 1}. ${player.username}</strong></p>
                <p>Flags Scored: ${player.flags_scored}</p>
            </div>
        `;
            leaderboardContainer.appendChild(leaderboardItem);
        });

        document.getElementById('uploadImg').onclick = () => {
            // programmatically click hidden input button bc styling is a pain
            document.getElementById('fileInput').click();
        };

        document.getElementById('fileInput').onchange = (event) => {
            const file = event.target.files[0];
            if (!file) return;

            this.uploadProfileImg(file);
        }

    };
}