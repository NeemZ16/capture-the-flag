import { SCALE, COLOR } from '../../constants/gameConstants';

export default class Avatar {
  constructor(scene, id, data, localId) {
    this.scene = scene;
    this.id    = id;

    const x = data.x * SCALE;
    const y = data.y * SCALE;

    // body circle
    this.body = scene.add.circle(0, 0, 15, COLOR[data.team] || 0xffffff); //getting run time error here

    // name text
    this.name = scene.add.text(-20, -30, data.username, {
      fontSize: '14px',
      fill: '#fff'
    });

    // container
    this.container = scene.add.container(x, y, [ this.body, this.name ]);

    // outline if local
    if (id === localId) {
      this.outline = scene.add.circle(0, 0, 18);
      this.outline.setStrokeStyle(2, 0xffffff);
      this.container.add(this.outline);
    }

    // flag‐carry icon
    if (data.hasFlag) {
      this._addCarryIcon(data.hasFlag);
    }
  }

  _addCarryIcon(team) {
    this.carry = this.scene.add.text(0, -40, '⚑', {
      fontSize: '18px',
      fill: '#fff'
    }).setOrigin(0.5, 1).setTint(COLOR[team]);
    this.container.add(this.carry);
  }

  update(data) {
    // move
    const x = data.x * SCALE;
    const y = data.y * SCALE;
    this.container.setPosition(x, y);

    // rename
    this.name.setText(data.username);

    // carry logic
    if (data.hasFlag && !this.carry) {
      this._addCarryIcon(data.hasFlag);
    } else if (!data.hasFlag && this.carry) {
      this.carry.destroy();
      delete this.carry;
    }
  }

  destroy() {
    this.container.destroy();
  }
}