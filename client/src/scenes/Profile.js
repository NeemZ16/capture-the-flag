import { BaseScene } from './BaseScene';

export class Profile extends BaseScene {
    constructor() {
        super('Profile');
    }

    create() {
        document.getElementById('profile-wrapper').style.display = 'block';
        document.getElementById('startGame').onclick = () => {
            document.getElementById('profile-wrapper').style.display = 'none';
            this.scene.start('Game');
        };
        
        
    }

}