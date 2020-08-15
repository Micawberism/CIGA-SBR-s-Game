//===========================================================
// GameTable
// 游戏桌面。
//===========================================================

//导入
import {Graphics, Container} from 'pixi.js';
import {GameManager} from './GameManager';

//-----------------------------------------------------------
// GameTable_Base
//
// 游戏桌面的基类。
//-----------------------------------------------------------

class GameTable_Base extends Graphics {

    constructor() {
        super();
        this.initialize.apply(this, arguments);
    }

    initialize(x, y) {
        this.tile = [x, y];
        this.tileWidth = 48;
    }

}

//-----------------------------------------------------------
// GameTable_Card
//
// 桌面上的卡牌。
//-----------------------------------------------------------

export class GameTable_Card extends GameTable_Base {

    constructor(...args) {
        super(...args);
    }

    initialize(x, y) {
        super.initialize(x, y);
        this.initMembers();
        this.drawCard();
        this.drawLabel();
        this.setInteraction();
    }

    initMembers() {
        this.inserted = false;
        this.inserting = true;
    }

    drawCard() {
        this.lineStyle(1, 0xffffff, 1, 0);
        this.beginFill(0x333333);
        this.drawRect(0, 0, this.tileWidth * this.tile[0], this.tileWidth * this.tile[1]);
        this.endFill();
    }

    drawLabel() {
        //
    }

    setInteraction() {
        this.interactive = true;
        this.on('click', this.onMouseClick)
            .on('pointermove', this.onMouseMove);
    }

    onMouseClick() {
        if(!this.inserted) {
            this.onDragClick();
        }
        else {
            this.onMapClick();
        }
    }

    onMouseMove(e) {
        if(!this.inserted) {
            this.onDragMove(e);
        }
    }

    onDragClick() {
        if(GameManager.currentMap.mouseOnMap) {
            GameManager.currentMap.insertSlot();
        }
    }

    onDragMove(event) {
        const p = event.data.getLocalPosition(this.parent);
        this.x = p.x - this.width / 2;
        this.y = p.y - this.height / 2;
        if(GameManager.currentMap.mouseOnMap) {
            this.cardOnMap = true;
        }
        else {
            this.cardOnMap = false;
        }
    }

    onMapClick() {
        if(this.inserting) {
            this.inserted = false;
            GameManager.currentCard = this;
            GameManager.currentMap.pullSlot();
        }
    }

}

//-----------------------------------------------------------
// GameTable_Map
//
// 桌面上的版图。
//-----------------------------------------------------------

export class GameTable_Map extends GameTable_Base {

    constructor() {
        super();
    }

    initialize() {
        super.initialize(12, 8);
        this.drawMap();
        this.setMap();
    }

    drawMap() {
        this.lineStyle(1, 0xffffff, 1, 0);
        this.beginFill(0x228822);
        this.drawRect(0, 0, this.tile[0] * this.tileWidth, this.tile[1] * this.tileWidth);
        this.endFill();
        for(let x = 0;x <= this.tile[0];x++) {
            this.moveTo(x * this.tileWidth, 0);
            this.lineTo(x * this.tileWidth, this.tileWidth * this.tile[1]);
        }
        for(let y = 0;y <= this.tile[1];y++) {
            this.moveTo(0, y * this.tileWidth);
            this.lineTo(this.tile[0] * this.tileWidth, y * this.tileWidth);
        }
    }

    setMap() {
        this.mapData = new Array(this.tile[0] * this.tile[1]);
        this.mapData.fill(0);
        this.interactive = true;
        this.on('pointermove', this.onMouseMove);
    }

    onMouseMove(event) {
        const p = event.data.getLocalPosition(this.parent);
        if(p.x > this.x && p.x < this.x + this.width && p.y > this.y && p.y < this.y + this.height) {
            this.mouseOnMap = true;
            if(GameManager.currentCard) {
                if(GameManager.currentCard.cardOnMap) {
                    this.positionCheck();
                    this.slotCheck();
                    this.moveSlot();
                }
            }
        }
        else {
            this.mouseOnMap = false;
            if(this.slot) {
                this.slot.visible = false;
                this.slot = null;
            }
        }
    }

    positionCheck() {
        const cardPos = GameManager.currentCard.position;
        const dx = cardPos.x - this.x;
        const dy = cardPos.y - this.y;
        const x = Math.floor(dx / this.tileWidth);
        const y = Math.floor(dy / this.tileWidth);
        this.cardData = [Math.min(this.tile[0], Math.max(0, x)), Math.min(this.tile[1], Math.max(0, y))];
        this.drawSlot();
    }

    slotCheck() {
        const cur = GameManager.currentCard;
        if(this.cardData) {
            if(this.cardData[0] + cur.tile[0] > this.tile[0] || this.cardData[1] + cur.tile[1] > this.tile[1]) {
                this.canSetup = false;
                return;
            }
            for(let i = 0;i < cur.tile[0];i++) {
                for(let j = 0;j < cur.tile[1];j++) {
                    if(this.getMapData(i, j) == 1) {
                        this.canSetup = false;
                    }
                }
            }
            this.canSetup = true;
        }
    }

    drawSlot() {
        if(!this.slot) {
            this.slot = new Graphics();
            this.slot.alpha = 0.7;
            this.slot.beginFill(0xff7777);
            this.slot.drawRect(0, 0,
                GameManager.currentCard.tile[0] * this.tileWidth, GameManager.currentCard.tile[1] * this.tileWidth);
            this.slot.endFill();
            this.slot.visible = false;
            this.addChild(this.slot);
        }
    }

    moveSlot() {
        if(this.slot && this.canSetup) {
            this.slot.visible = true;
            this.slot.position.set(this.cardData[0] * this.tileWidth, this.cardData[1] * this.tileWidth);
        }
    }

    insertSlot() {
        if(this.canSetup) {
            const card = GameManager.currentCard;
            GameManager.currentCard = null;
            card.position.set(this.x + this.slot.x, this.y + this.slot.y);
            card.inserted = true;
            this.removeChild(this.slot);
            this.slot = null;
        }
    }

    pullSlot() {
        if(GameManager.currentCard) {
            const card = GameManager.currentCard;
            card.position.set(card.x, card.y);
        }
    }

    getMapData(x, y) {
        return this.mapData[x + y * this.tile[0]];
    }

}