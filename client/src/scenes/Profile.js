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

    updatePlayerStatsUI(stats) {
        document.querySelector("#kills .value").innerText = stats.kills
        document.querySelector("#steals .value").innerText = stats.steals
        document.querySelector("#scored .value").innerText = stats.flags_scored
    }

    fetchProfileImg() {

    }

    updateProfileImg() {

    }

    create() {
        const playerStats = this.fetchPlayerStats(this.game.username)
        document.getElementById('profile-wrapper').style.display = 'block';
        document.getElementById('startGame').onclick = () => {
            document.getElementById('profile-wrapper').style.display = 'none';
            this.scene.start('Game');
        };
        document.getElementById('welcomeText').innerText = `hi ${this.game.username}!`;
        document.getElementById('username').innerText = this.game.username;

        // Select achievements container
        const achievementsContainer = document.querySelector('.achievements');

        // Example achievements with progress tracking
        const achievements = [
            { title: "First Blood", description: "Get your first kill.", progress: playerStats.kills, max: 1 },
            { title: "Flag Master", description: "Capture 5 flags.", progress: playerStats.flags_scored, max: 5 },
            { title: "Master Ninja", description: "Steal 10 flags from enemies.", progress: playerStats.steals, max: 10 }
        ];

        // Clear previous content
        achievementsContainer.innerHTML = "<h2>Achievements</h2>";

        // Loop through achievements and display progress
        achievements.forEach(achievement => {
            const achElement = document.createElement('div');
            achElement.classList.add('achievement-card');
            achElement.innerHTML = `
                <strong>${achievement.title}</strong><br>
                <p>${achievement.description}</p>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${ (achievement.progress / achievement.max) * 100 }%;"></div>
                </div>
                <p>${achievement.progress} / ${achievement.max}</p>
            `;
            achievementsContainer.appendChild(achElement);
        });
    }

}