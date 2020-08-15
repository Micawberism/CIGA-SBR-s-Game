//===========================================================
// GameComponent
// 游戏组件。
//===========================================================

//导入
import {Container, Graphics, Text} from 'pixi.js'
import {GameManager} from './GameManager';

//-----------------------------------------------------------
// GameFrame
//
// 游戏框体。
//-----------------------------------------------------------

export class GameFrame extends Container {

    constructor() {
        super();
        this.initialize.apply(this, arguments);
    }

    initialize(x, y, w, h, type = false) {
        this.frame = null;
        if(type) {
            const sw = GameManager.width();
            const sh = GameManager.height();
            const per = 0.01;
            const dx = sw * x * per;
            const dy = sh * w * per;
            this.drawFrame(sw * y * per - dx, sh * h * per - dy);
            this.position.set(dx, dy);
        }
        else {
            this.drawFrame(w, h);
            this.position.set(x, y);
        }
        this.setContext();
    }

    drawFrame(w, h) {
        this.frame = new Graphics();
        this.frame.lineStyle(1, 0xffffff, 1, 0);
        this.frame.drawRoundedRect(0, 0, w, h);
        this.addChild(this.frame);
    }

    setContext() {
        this.context = new Container();
        this.addChild(this.context);
    }

    addToFrame(object) {
        this.context.addChild(object);
    }

}

//-----------------------------------------------------------
// GameCardList
//
// 游戏卡牌列表。
//-----------------------------------------------------------

export class GameCardList extends GameFrame {
    
    constructor() {
        super();
    }

    initialize() {
        this.setupList();
        super.initialize(0, 0, this.maxItemWidth + 50, this.items.length * this.itemHeight + 100);
        this.resizeList();
    }

    setupList() {
        this.list = GameManager.deck.drawCards();
        this.items = [];
        this.maxItemWidth = 0;
        for(let i of this.list) {
            const item = new GameCardItem(i);
            item.setInteraction(this.onBuyCard.bind(item));
            this.items.push(item);
            if(item.width > this.maxItemWidth) {
                this.maxItemWidth = item.width;
            }
        }
        const cancel = new GameItem('放弃', 28);
        cancel.setInteraction(this.onCancel);
        this.items.push(cancel);
        this.itemHeight = this.items[0].height;
    }

    onBuyCard() {
        if(GameManager.player.resources[0].value - this.cardData.cost > 0) {
            GameManager.player.express.push(this.cardData);
            GameManager.player.resources[0].value -= this.cardData.cost;
            GameManager.message = null;
            GameManager.nowAction = 0;
        }
    }

    onCancel() {
        GameManager.nowAction = 0;
    }

    drawFrame(w, h) {
        this.frame = new Graphics();
        this.frame.lineStyle(3, 0x073464, 1, 1);
        this.frame.beginFill(0xb0bec5);
        this.frame.drawRoundedRect(0, 0, w, h);
        this.frame.endFill();
        this.addChild(this.frame);
    }

    resizeList() {
        const h = this.height / 5;
        for(let i = 0;i < this.items.length;i++) {
            this.items[i].position.set((this.width - this.items[i].width) / 2, h * (i + 1) - this.itemHeight / 2);
            this.addToFrame(this.items[i]);
        }
    }

}

//-----------------------------------------------------------
// GameItem
//
// 游戏选项。
//-----------------------------------------------------------

export class GameItem extends Container {

    constructor() {
        super();
        this.initialize.apply(this, arguments);
    }

    initialize(label, size) {
        this.drawItem(label, size);
        this.drawSelected();
    }
    
    drawItem(label, size) {
        this.item = GameManager.drawText(label, 0, 0, size);
        this.addChild(this.item);
    }

    drawSelected() {
        this.selected = new Graphics();
        this.selected.lineStyle(2, 0xffffff, 1, 0);
        this.selected.moveTo(0, this.item.height);
        this.selected.lineTo(this.item.width, this.item.height);
        this.changeSelect(false);
        this.addChild(this.selected);
    }

    changeSelect(focus) {
        this.selected.visible = focus;
    }

    setInteraction(func) {
        this.interactive = true;
        this.on('pointerover', this.onItemOver)
            .on('pointerout', this.onItemOut)
            .on('click', this.setItemClick(func));
    }

    onItemOver() {
        this.changeSelect(true);
    }

    onItemOut() {
        this.changeSelect(false);
    }

    setItemClick(func) {
        return function() {
            func();
        }
    }
    
}

//-----------------------------------------------------------
// GameItem
//
// 游戏选项。
//-----------------------------------------------------------

export class GameCardItem extends GameItem {

    constructor(...args) {
        super(...args);
    }

    initialize(data) {
        this.cardData = data;
        super.initialize(data.label, 28);
    }

    onItemOver() {
        super.onItemOver();
        GameManager.message = this.cardData;
    }

    onItemOut() {
        super.onItemOut();
        GameManager.message = null;
    }

}

//-----------------------------------------------------------
// GamePhaseShow
//
// 回合展示。
//-----------------------------------------------------------

export class GamePhaseShow extends Container {

    constructor() {
        super();
        this.initialize();
    }

    initialize() {
        this.show = null;
    }

    showPhaseStart() {
        if(!this.show) {
            this.show = GameManager.drawText('新的一周开始了……', 0, 0, 36);
            this.showCenter();
            this.addChild(this.show);
        }
    }

    showInternetAction() {
        if(!this.show) {
            this.show = new GameCardList();
            this.showCenter();
            this.addChild(this.show);
            GameManager.actionTimes--;
        }
    }

    showCenter() {
        this.show.position.set((GameManager.width() - this.show.width) / 2,
                            (GameManager.height() - this.show.height) / 2);
    }

    isShowed() {
        return !!this.show;
    }

    closeShow() {
        if(this.show) {
            this.removeChildren();
            this.show = null;
        }
    }
    
}

//-----------------------------------------------------------
// GameStatus
//
// 游戏状态显示。
//-----------------------------------------------------------

export class GameStatus extends GameFrame {
    
    constructor(...args) {
        super(...args);
        this.redraw();
    }

    redraw() {
        this.context.removeChildren();
        this.drawLocation();
        this.drawResources();
    }

    drawLocation() {
        this.location = GameManager.drawText('当前所在地：' + GameManager.player.location, 20, 0);
        this.location.y = (this.height - this.location.height) / 2;
        this.addToFrame(this.location);
    }

    drawResources() {
        const y = this.location.y;
        let w = this.location.width;
        for(let r of GameManager.player.resources) {
            const res = GameManager.drawText(`${r.label}：${r.value}`, w + 30, y);
            res.style.fill = r.color;
            this.addToFrame(res);
            w += res.width;
        }
    }

}

//-----------------------------------------------------------
// GameConsole
//
// 游戏显示。
//-----------------------------------------------------------

export class GameConsole extends GameFrame {
        
    constructor(...args) {
        super(...args);
        this.pad = 5;
        this.console = null;
        this.showingNews = false;
        this.showingCard = false;
    }

    showConsole() {
        if(GameManager.message) {
            this.drawCard();
        }
        else {
            this.drawNews();
        }
    }

    drawCard() {
        if(!this.showingCard) {
            this.showingNews = false;
            this.context.removeChildren();
            const message = GameManager.message;
            let ty = 0;
            const label = GameManager.drawText(message.label, this.pad, this.pad);
            ty += label.height + 20;
            this.addToFrame(label);
            const type = GameManager.drawText('类别：' + message.type, this.pad, ty);
            ty += type.height + 20;
            this.addToFrame(type);
            const cost = GameManager.drawText('费用：' + message.cost, this.pad, ty);
            ty += cost.height + 20;
            this.addToFrame(cost);
            const time = GameManager.drawText('运送时间：' + message.time, this.pad, ty);
            ty += time.height + 20;
            this.addToFrame(time);
            const description = GameManager.drawText(message.description, this.pad, ty + 20, 20);
            GameManager.autoWrap(description, this.width);
            this.addToFrame(description);
        }
    }

    drawNews() {
        if(!this.showingNews) {
            this.showingCard = false;
            this.context.removeChildren();
            const title = GameManager.drawText(GameManager.news.title, this.pad, this.pad);
            this.addToFrame(title);
            const padding = GameManager.drawText('------', this.pad, title.height);
            this.addToFrame(padding);
            const text = GameManager.drawText(GameManager.news.context, this.pad, title.height + padding.height, 20);
            GameManager.autoWrap(text, this.width);
            this.addToFrame(text);
        }
    }

}

//-----------------------------------------------------------
// GameAction
//
// 游戏显示。
//-----------------------------------------------------------

export class GameAction extends Container {
        
    constructor() {
        super();
        this.drawItems();
    }

    drawItems() {
        const item1 = new GameItem('移动空间站', 32);
        const item2 = new GameItem('启动引擎', 32);
        const item3 = new GameItem('星际网络', 32);
        item1.setInteraction(this.action(1).bind(item1));
        item2.setInteraction(this.action(2).bind(item2));
        item3.setInteraction(this.action(3).bind(item3));
        this.items = [item1, item2, item3];
        this.resizeItems();
    }

    resizeItems() {
        let a = false;
        for(let i of this.items) {
            i.x = a ? this.width + 50 : this.width;
            this.addChild(i);
            a = true;
        }
    }

    action(id) {
        return function() {
            if(GameManager.nowAction == 0) {
                this.interactive = false;
                this.changeSelect(false);
                this.alpha = 0.7;
                GameManager.nowAction = id;
            }
        }
    }

    activation() {
        for(let i of this.items) {
            i.interactive = true;
            i.alpha = 1;
        }
    }

}

//-----------------------------------------------------------
// GameDeck
//
// 游戏卡牌数据类。
//-----------------------------------------------------------

export class GameDeck {

    constructor() {
        this.decks = GameManager.getData('deck');
        this.cards = GameManager.getData('cards');
        this.news = GameManager.getData('news');
        this.starList = this.decks.map(s => s.realm);
        this.moveStar(this.starList[0]);
    }

    moveStar(realm) {
        this.star = this.decks.find(s => s.realm == realm);
        this.setupDeck();
    }

    showRealm() {
        return this.star.realm;
    }

    setupDeck() {
        this.nowDeck = [];
        for(let c of this.star.cards) {
            for(let i = 0;i < c.num;i++) {
                const cd = new GameCardData(this.cards.find(x => x.label == c.label));
                this.nowDeck.push(cd);
            }
        }
        this.shuffle();
    }

    headlines() {
        let per = 0;
        const pointer = Math.random();
        for(let n of this.star.news) {
            if(pointer >= per && pointer < n.times) {
                const data = this.news.find(x => x.title == n.title);
                GameManager.news.title = data.title;
                GameManager.news.context = data.context;
                break;
            }
            else {
                per = n.times;
            }
        }
    }

    shuffle() {
        for(let i = 0;i < this.nowDeck.length;i++) {
            let j = Math.floor(Math.random() * i);
            let temp = this.nowDeck[i];
            this.nowDeck[i] = this.nowDeck[j];
            this.nowDeck[j] = temp;
        }
    }

    drawCards() {
        return this.nowDeck.splice(0, 3);
    }

}

//-----------------------------------------------------------
// GameCardData
//
// 游戏卡牌数据类。
//-----------------------------------------------------------

export class GameCardData {

    constructor(data) {
        this.label = data.label;
        this.type = data.type;
        this.cost = data.cost;
        this.time = data.time;
        this.capacity = data.capacity;
        this.description = data.description;
    }

}