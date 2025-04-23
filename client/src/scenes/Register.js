import { BaseScene } from './BaseScene';

export class Register extends BaseScene {
    constructor() {
        super('Register');
    }

    create() {
        this.uiContainer = this.add.container(this.dimensions.width / 2, this.dimensions.height / 2).setInteractive();
        const logo = this.add.image(0, -100, 'logo')
            .setInteractive({ cursor: 'pointer' })
            .on('pointerdown', () => {
                this.scene.start('MainMenu')
            });
        this.uiContainer.add(logo);

        const usernameInput = this.add.dom(0, 30).createFromHTML(`
            <input type="text" name="username" placeholder="Username" autocomplete="off"/>
        `);
        this.uiContainer.add(usernameInput);

        const passwordInput = this.add.dom(0, 30 + 50).createFromHTML(`
            <input type="password" name="password" placeholder="Password" autocomplete="off"/>
        `);
        this.uiContainer.add(passwordInput);

        const passwordInputConf = this.add.dom(0, 30 + 50 * 2).createFromHTML(`
            <input type="password" name="password" placeholder="Confirm Password" autocomplete="off"/>
        `);
        this.uiContainer.add(passwordInputConf);

        const regBtn = this.createBtn(0, 30 + 50 * 3, 'Register', () => {
            this.scene.start('Game');
        })
        this.uiContainer.add(regBtn);
    }

    onResize() {
        this.uiContainer.setPosition(
            this.dimensions.width / 2,
            this.dimensions.height / 2
        );
    }
}
