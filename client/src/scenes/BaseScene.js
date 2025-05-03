import { Scene } from 'phaser';

export class BaseScene extends Scene {
    constructor(key) {
        super(key);
        this.dimensions = { width: 0, height: 0 };
    }

    init() {
        // set dimensions
        this.dimensions.width = this.scale.width;
        this.dimensions.height = this.scale.height;

        this.scale.on('resize', this.handleResize, this);
    }

    /**
     * Reposition elements after resize in `onResize` function
     * @param {*} gameSize - automatically passed in
     */
    handleResize(gameSize) {
        this.dimensions.width = gameSize.width;
        this.dimensions.height = gameSize.height;

        if (this.onResize) {
            this.onResize(gameSize);
        }
    }

    /**
     * Utility function to create a button
     * @param {number} x - x position of the button
     * @param {number} y - y position of the button
     * @param {string} text - button label
     * @param {function} action - callback function for pointerdown event
     * @returns {Phaser.GameObjects.Text} - the created button
     */
    createBtn(x, y, text, action) {
        const btn = this.add.text(x, y, text, {
            fontFamily: '"Jersey 10"',
            backgroundColor: '#FFC20C',
            fontSize: '25px',
            color: '#000000'
        })
            .setPadding(10, 5)
            .setOrigin(0.5)
            .setInteractive({ cursor: 'pointer' });

        btn.on('pointerdown', action);

        btn.on('pointerover', () => {
            btn.setStyle({ backgroundColor: '#FFB000' });
        });

        btn.on('pointerout', () => {
            btn.setStyle({ backgroundColor: '#FFC20C' });
        });

        return btn;
    }

    handleLogout() {
        const url = import.meta.env.VITE_API_URL + "logout";
        fetch(url, {
            method: 'POST',
            credentials: 'include', // will include the auth_token cookie
        })
            .then((res) => res.text().then((text) => ({ status: res.status, text })))
            .then(({ status, text }) => {
                // reset username and reload should go to main menu
                this.game.username = null;
                window.location.reload();
            })
    }

    /**
     * Asynchronous function to ping /me and check if logged in.
     * Called in preloader to automatically change from main menu to game.
     * @returns promise with isLoggedIn and username game vars
     */
    isLoggedIn() {
        // check if logged in
        const currentUserURL = import.meta.env.VITE_API_URL + "me";
        return fetch(currentUserURL, {
            method: 'GET',
            credentials: 'include'
        })
            .then((res) => res.json())
            .then((data) => {
                this.game.username = data.username || "";
                this.game.isLoggedIn = !!data.username;
                return [this.game.isLoggedIn, this.game.username];
            })
            .catch(err => console.log(err))
    }
}
