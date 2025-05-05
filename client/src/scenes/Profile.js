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
            console.log(stats)
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

    fetchProfileImg() {

    }

    updateProfileImg() {

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
    }

}