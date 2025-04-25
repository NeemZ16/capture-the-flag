import { BaseScene } from './BaseScene';

export class Login extends BaseScene {
    constructor() {
        super('Login');
    }

    create() {
        // check if logged in
        this.isLoggedIn().then(([isLoggedIn, username]) => {
            if (isLoggedIn) {
                this.game.username = username;
                this.scene.start('Game');
            }
        });

        this.uiContainer = this.add.container(this.dimensions.width / 2, this.dimensions.height / 2).setInteractive();
        const logo = this.add.image(0, -100, 'logo')
            .setInteractive({ cursor: 'pointer' })
            .on('pointerdown', () => {
                this.scene.start('MainMenu')
            });
        this.uiContainer.add(logo);

        this.formFields = this.add.dom(0, 30 + 50).createFromHTML(`
            <input id="username" type="text" placeholder="Username" autocomplete="off"/>
            <input id="pwd" type="password" placeholder="Password" autocomplete="off"/>
        `);
        this.uiContainer.add(this.formFields);

        const loginBtn = this.createBtn(0, 50 * 3, 'Login', () => {
            this.handleSubmit();
        })
        this.uiContainer.add(loginBtn);

        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.enterKey.on('down', () => {
            this.handleSubmit();
        })
    }

    handleSubmit() {
        // get input values
        const fields = this.formFields.node;
        const username = fields.querySelector('#username').value.trim();
        const password = fields.querySelector('#pwd').value.trim();
        let msg = "";
        let isValid = false;

        // validate input
        if (!username || !password) {
            msg = "please fill out all fields :(";
        } else {
            // let backend handle everything else
            isValid = true;
        }

        // dont make api call if basic validation fails
        if (!isValid) { this.showMessage(isValid, msg); return }

        // fetch call to register endpoint with form values
        const url = import.meta.env.VITE_API_URL + "login";
        fetch(url, {
            method: 'POST',
            credentials: 'include', // will include the auth_token cookie
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        })
            .then((res) => res.text().then((text) => ({ status: res.status, text })))
            .then(({ status, text }) => {
                if (status === 200) {
                    this.showMessage(isValid, text);
                    setTimeout(() => {
                        // this.scene.start('Game');
                        window.location.reload();
                    }, 1000);
                } else {
                    // backend error message
                    this.showMessage(!isValid, text);
                }
            })
            .catch((err) => {
                this.showMessage(!isValid, err);
            })

    }

    showMessage(isSuccess, message) {
        // set field border color to red/green
        let classToAdd = isSuccess ? 'success' : 'error';
        const fields = this.formFields.node;
        const username = fields.querySelector('#username');
        username.classList.add(classToAdd);
        const pwd = fields.querySelector('#pwd');
        pwd.classList.add(classToAdd);

        // set msg from backend
        if (this.msg) { this.msg.destroy() }
        const tintColor = isSuccess ? 0x79e679 : 0x8b0303;
        this.msg = this.add.bitmapText(
            0, 0, 'pixel', message, 14
        )
            .setOrigin(0.5)
            .setTint(tintColor);
        this.uiContainer.add(this.msg);
    }

    onResize() {
        this.uiContainer.setPosition(
            this.dimensions.width / 2,
            this.dimensions.height / 2
        );
    }
}
