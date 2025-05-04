// FUNCTIONS TO HANDLE UPDATING PLAYER SCORES

import { COLOR } from "./gameConstants";

export function createPlayerScoreItem(username, score, color) {
    if (username in this.playerScoreItems) return;
    const index = Object.keys(this.playerScoreItems).length;
    const scoreItemHeight = 20
    const y = 4 + index * (scoreItemHeight + 4);

    const playerListingsWidth = 175;
    const itemContainer = this.add.container(0, y);
    const nameText = this.add.bitmapText(5, 4, 'pixel', username, 12).setTint(COLOR[color]);
    const scoreText = this.add.bitmapText(playerListingsWidth - 20, 4, 'pixel', score.toString(), 12);

    itemContainer.add([nameText, scoreText]);
    this.playerListings.add(itemContainer);

    this.playerScoreItems[username] = {
        container: itemContainer,
        scoreText
    };
}

export function removePlayerScoreItem(username, scene) {


}

export function updatePlayerScoreItem(username, score, scene) {


}