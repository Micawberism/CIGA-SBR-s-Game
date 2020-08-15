//===========================================================
// SceneManager
// 场景管理器。
//===========================================================

// 导入
import {GameManager} from './GameManager';
import {GameScene_Load} from './GameScene';

//-----------------------------------------------------------
// SceneManager
//
// 场景管理器。
//-----------------------------------------------------------

export class SceneManager {

    constructor() {
        throw new Error('This is a static class.');
    }

    static run() {
        this.initialize();
        this.moveScene(GameScene_Load);
        this.setUpdate();
    }

    static initialize() {
        this.current = null;
        this.next = null;
    }

    static moveScene(scene) {
        if(scene) {
            this.next = new scene();
            if(this.current) {
                this.current.stop();
            }
            this.changeScene();
        }
    }

    static changeScene() {
        if(this.next) {
            if(this.current) {
                this.current.terminate();
            }
            this.current = this.next;
            if(this.current) {
                this.current.create();
                this.next = null;
            }
        }
    }

    static setUpdate() {
        GameManager.addToUpdate(this.updateScene.bind(this));
    }

    static updateScene(delta) {
        if(this.current && this.current.isReady()) {
            this.current.update(delta);
        }
    }

}