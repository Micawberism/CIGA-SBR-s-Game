//===========================================================
// GameManager
// 游戏管理器。
//===========================================================

// 导入
import {Application, Text} from 'pixi.js';
import {GameDeck} from './GameComponent'

//-----------------------------------------------------------
// GameManager
//
// 游戏管理器。
//-----------------------------------------------------------

export class GameManager {

    constructor() {
        throw new Error('This is a static class.');
    }

    static setup() {
        this.initApp();
    }

    static initApp() {
        this.app = new Application({
            width: 960,
            height: 600,
            backgroundColor: 0x000000
        });
        document.body.appendChild(this.app.view);
    }

    static initMain() {
        this.currentMap = null;
        this.currentCard = null;
        this.notifications = null;
        this.nowPhase = 0;
        this.needSetup = false;
        this.confirmSetup = false;
        this.expIndex = -1;
        this.news = {
            title: '',
            context: ''
        };
        this.danger = null;
        this.message = null;
        this.actionTimes = 2;
        this.nowAction = 0;
        this.actionItem = null;
        this.useEngine = false;
        this.onBuyingCard = false;
        this.ending = '';
        this.initPlayer();
    }

    static initPlayer() {
        this.deck = new GameDeck();
        this.player = {
            location: this.deck.showRealm(),
            resources: [
                {label: '资金', value: 1, color: 'yellow'},
            ],
            express: [],
            cards: [],
            victory: {}
        };
        this.deck.initGift();
    }

    static addToStage(object) {
        this.app.stage.addChild(object);
    }

    static clearStage() {
        this.app.stage.removeChildren();
    }

    static width() {
        return this.app.view.width;
    }

    static height() {
        return this.app.view.height;
    }

    static addToUpdate(func) {
        this.app.ticker.add(func);
    }

    static drawText(str, x, y, size = 24) {
        const text = new Text(str, {
            fill: 'white',
            fontSize: size
        });
        text.position.set(x, y);
        return text;
    }

    static autoWrap(text, width) {
        let words = text.text;
        text.style.wordWrap = true;
        text.style.wordWrapWidth = width;
        const wordWidth = text.style.fontSize;
        const lineCount = Math.floor(width / wordWidth);
        for(let i = lineCount;i < words.length;i+=lineCount) {
            words = words.slice(0, i) + '\n' + words.slice(i);
        }
        text.text = words;
    }

    static initData() {
        this.dataList = [
            'cards',
            'news',
            'deck',
            'start'
        ];
        this.dataBase = {};
    }

    static loadDataBase() {
        for(let i = 0;i < this.dataList.length;i++) {
            this.loadDataFile(this.dataList[i]);
        }
    }

    static loadDataFile(src) {
        const data = require('../data/' + src);
        this.dataBase[src] = data;
    }

    static getData(key) {
        return this.dataBase[key];
    }

    static analysisCommand(command) {
        const com = command.split(' ');
        switch(com[0]) {
            case '资金': {
                GameManager.player.resources[0].value += parseInt(com[1]);
                GameManager.notifications.pushNotice(command);
            }
            break;
            case 'add': {
                const card = this.deck.cards.find(x => x.label == com[1]);
                card.time = 1;
                GameManager.player.express.push(card);
                GameManager.notifications.pushNotice('获得' + com[1] + '！');
            }
            break;
            case 'vict': {
                let vp = parseInt(com[2]);
                GameManager.player.victory[com[1]] += vp;
                GameManager.notifications.pushNotice(com[1] + '具有' + GameManager.player.victory[com[1]] + '%进度！');
            }
            break;
            case '防御': {
                const defence = GameManager.player.resources.find(x => x.label == '防御');
                defence.value += parseInt(com[1]);
            }
            break;
        }
    }

}