import { COLOR } from "./gameConstants";

export class PlayerScoreList {
    constructor(scene, container, itemHeight = 20, padding = 4) {
        this.scene = scene;
        this.container = container;
        this.itemHeight = itemHeight;
        this.padding = padding;
        this.items = new Map();
    }

    add(username, score, color) {
        if (this.items.has(username)) return;

        const y = this.padding + this.items.size * (this.itemHeight + this.padding);
        const item = this.scene.add.container(0, y);
        const nameText = this.scene.add.bitmapText(5, 4, 'pixel', username, 12).setTint(COLOR[color]);
        const scoreText = this.scene.add.bitmapText(155, 4, 'pixel', score.toString(), 12);
        item.add([nameText, scoreText]);
        this.container.add(item);

        this.items.set(username, { container: item, scoreText });
    }

    remove(username) {
        const entry = this.items.get(username);
        if (!entry) return;

        entry.container.destroy();
        this.items.delete(username);

        // update position of other elements
        let i = 0;
        for (const { container } of this.items.values()) {
            container.setY(this.padding + i * (this.itemHeight + this.padding));
            i++;
        }
    }

    updateScore(username, score, scoreColor) {
        const entry = this.items.get(username);
        const scoreStr = typeof score === "number" ? score.toString() : score;
        if (entry) entry.scoreText.setText(scoreStr);
        
        // flash in color scored
        entry.scoreText.setTint(COLOR[scoreColor]);
        this.scene.time.delayedCall(100, () => {
            entry.scoreText.setTint(0xffffff);
        });
    }
}