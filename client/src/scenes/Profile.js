import { BaseScene } from './BaseScene';

export class Profile extends BaseScene {
    constructor() {
        super('Profile');
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

    create() {
        document.getElementById('profile-wrapper').style.display = 'block';
        document.getElementById('startGame').onclick = () => {
            document.getElementById('profile-wrapper').style.display = 'none';
            this.scene.start('Game');
        };
        document.getElementById('welcomeText').innerText = `hi ${this.game.username}!`;
        document.getElementById('username').innerText = this.game.username;
        document.getElementById('logout').onclick = () => {
            this.handleLogout();
        }

        this.getProfileImg();

        document.getElementById('uploadImg').onclick = () => {
            // programmatically click hidden input button bc styling is a pain
            document.getElementById('fileInput').click();
        };

        document.getElementById('fileInput').onchange = (event) => {
            const file = event.target.files[0];
            if (!file) return;

            this.uploadProfileImg(file);
        };
    }
}