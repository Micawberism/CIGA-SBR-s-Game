//===========================================================
// GameScene
// 游戏场景。
//===========================================================

// 导入
import {Container, filters, Graphics} from 'pixi.js';
import {GlitchFilter, BulgePinchFilter, ZoomBlurFilter} from 'pixi-filters'
import {GameManager} from './GameManager';
import {SceneManager} from './SceneManager';
import {GameTable_Card, GameTable_Map} from './GameTable';
import {GameFrame, GameItem, GamePhaseShow, GameStatus, GameAction, GameConsole, GameNotifications} from './GameComponent';

//-----------------------------------------------------------
// GameScene_Base
//
// 游戏场景的基类。
//-----------------------------------------------------------

class GameScene_Base extends Container {

    constructor() {
        super();
        this.initialize();
    }

    initialize() {
        this.active = false;
    }

    create() {
        this.active = true;
        GameManager.addToStage(this);
    }

    isReady() {
        return this.active;
    }

    update() {
        //virtual method
    }

    stop() {
        this.active = false;
    }

    terminate() {
        GameManager.clearStage();
    }

}

//-----------------------------------------------------------
// GameScene_Load
//
// 载入场景。
//-----------------------------------------------------------

export class GameScene_Load extends GameScene_Base {

    constructor() {
        super();
    }

    initialize() {
        super.initialize();
        GameManager.setup();
    }

    create() {
        super.create();
        this.drawLogo();
        this.jumpLogo();
    }

    drawLogo() {
        this.logo = GameManager.drawText('铁球跑小队', GameManager.width() / 2, GameManager.height() / 2, 128);
        this.logo.anchor.set(0.5);
        this.logo.alpha = 0;
        this.logo.scale.set(0.2);
        this.logoFilter = new GlitchFilter();
        this.logo.filters = [this.logoFilter];
        GameManager.addToStage(this.logo);
        this.delayTime = 0;
    }

    jumpLogo() {
        this.logo.interactive = true;
        this.logo.on('click', this.onMouseClick.bind(this));
    }

    onMouseClick() {
        if(this.delayTime < 3.0) {
            this.logo.alpha = 1;
            this.logo.scale.set(1);
            this.logoFilter.enabled = false;
            this.delayTime = 2.0;
        }
    }

    update() {
        if(this.logo.alpha < 1) {
            this.logo.alpha = Math.min(this.logo.alpha + 0.01, 1);
            this.logo.scale.set(Math.min(this.logo.scale.x + 0.01, 1));
            this.logoFilter.refresh();
        }
        if(this.logo.alpha == 1 && this.logoFilter.enabled) {
            this.logoFilter.enabled = false;
        }
        if(!this.logoFilter.enabled) {
            this.delayTime += 1 / 60;
        }
        if(this.delayTime >= 3.0) {
            this.logo.alpha = Math.max(this.logo.alpha - 0.05, 0);
        }
        if(this.delayTime >= 4.0) {
            SceneManager.moveScene(GameScene_Title);
        }
    }

}


//-----------------------------------------------------------
// GameScene_Title
//
// 标题场景。
//-----------------------------------------------------------

export class GameScene_Title extends GameScene_Base {

    constructor() {
        super();
    }

    create() {
        super.create();
        this.drawtitle();
        this.drawItems();
    }

    drawtitle() {
        this.title = GameManager.drawText('深空茧居族', GameManager.width() / 15, GameManager.height() / 7, 72);
        this.addChild(this.title);
    }

    drawItems() {
        this.items = [];
        const start = new GameItem('开始', 36);
        start.setInteraction(this.startCommand);
        const end = new GameItem('结束', 36);
        end.setInteraction(this.endCommand);
        this.items.push(start, end);
        this.moveItems();
    }

    moveItems() {
        for(let i of this.items) {
            i.position.set(GameManager.width() / 9, this.height + 100);
            this.addChild(i);
        }
    }

    startCommand() {
        SceneManager.moveScene(GameScene_Start);
    }

    endCommand() {
        nw.App.quit();
    }

}

//-----------------------------------------------------------
// GameScene_Start
//
// 游戏开始的导入场景。
//-----------------------------------------------------------

export class GameScene_Start extends GameScene_Base {

    constructor() {
        super();
    }

    initialize() {
        super.initialize();
        GameManager.initData();
    }

    create() {
        super.create();
        GameManager.loadDataBase();
        this.startList = GameManager.getData('start');
        this.delayTime = 0;
    }

    update() {
        if(this.startList.length == 0) {
            SceneManager.moveScene(GameScene_Main);
        }
        if(this.startList.length > 0 && this.delayTime == 0) {
            this.removeChildren();
            this.description = GameManager.drawText(this.startList.shift(), 0, 0, 42);
            GameManager.autoWrap(this.description, GameManager.width() * 0.8);
            this.description.position.set((GameManager.width() - this.description.width) / 2,
                                    (GameManager.height() - this.description.height) / 2);
            this.addChild(this.description);
            this.description.interactive = true;
            this.description.on('click', () => {
                this.delayTime = 5.0;
            });
        }
        if(this.description && this.delayTime < 5.0) {
            this.delayTime += 1 / 60;
        }
        if(this.delayTime > 3.0) {
            this.description.alpha -= 0.05;
        }
        if(this.description.alpha <= 0) {
            this.delayTime = 0;
        }
    }

}

//-----------------------------------------------------------
// GameScene_Main
//
// 实际运行场景。
//-----------------------------------------------------------

export class GameScene_Main extends GameScene_Base {

    constructor() {
        super();
    }

    initialize() {
        super.initialize();
        GameManager.initMain();
    }

    create() {
        super.create();

        this.createBackground();
        this.createMap();
        this.createStatus();
        this.createConsole();
        this.createAction();
        this.createNotifications();

        this.setFilters();
        this.setPhase();
        this.setInteraction();
    }

    createBackground() {
        this.background = new Graphics();
        this.background.beginFill(0x000000);
        this.background.drawRect(0, 0, GameManager.width(), GameManager.height());
        this.background.endFill();
        this.addChild(this.background);
    }

    createMap() {
        this.map = new GameFrame('0', '70', '10', '90', true);
        this.addChild(this.map);
        const tmap = new GameTable_Map();
        tmap.x = (this.map.width - tmap.width) / 2;
        tmap.y = (this.map.height - tmap.height) / 2;
        this.map.addToFrame(tmap);
        GameManager.currentMap = tmap;
    }

    createStatus() {
        this.status = new GameStatus('0', '100', '0', '10', true);
        this.addChild(this.status);
    }

    createConsole() {
        this.console = new GameConsole('70', '100', '10', '90', true);
        this.addChild(this.console);
    }

    createAction() {
        this.action = new GameAction('0', '70', '90', '100', true);
        this.addChild(this.action);
    }

    createNotifications() {
        const notifications = new GameNotifications('70', '100', '90', '100', true);
        this.addChild(notifications);
        GameManager.notifications = notifications;
    }

    setFilters() {
        this.filters = [];
        this.blur = new filters.BlurFilter();
        this.filters.push(this.blur);
        this.changeBlur(false);
        this.zoomBlur = new ZoomBlurFilter();
        this.zoomBlur.strength = 0.01;
        this.zoomBlur.center.x = GameManager.width() / 2;
        this.zoomBlur.center.y = GameManager.height() / 2;
        this.zoomBlur.enabled = false;
        this.filters.push(this.zoomBlur);
    }

    changeBlur(focus) {
        this.blur.enabled = focus;
    }

    setPhase() {
        this.phaseShow = new GamePhaseShow();
        GameManager.addToStage(this.phaseShow);
        this.delayTime = 0;
    }

    setInteraction() {
        this.interactive = true;
        this.on('click', this.mouseAction)
            .on('pointermove', this.mouseMove)
    }

    mouseAction() {
        switch(GameManager.nowPhase) {
            case 0: {
                this.delayTime = 3;
            }
            break;
        }
    }

    mouseMove(event) {
        switch(GameManager.nowPhase) {
            case 3: {
                if(GameManager.useEngine && this.phaseShow.isShowed()) {
                    const p = event.data.getLocalPosition(this.parent);
                    this.phaseShow.show.position.set(p.x + 48, p.y + 48);
                }
            }
            break;
        }
    }

    update() {
        switch(GameManager.nowPhase) {
            case 0: this.phaseStart(); break;
            case 1: this.phaseExpress(); break;
            case 2: this.phaseNews(); break;
            case 3: this.phaseAction(); break;
            case 4: this.phaseDanger(); break;
            case 5: this.phaseCost(); break;
            case 6: this.phaseVictory(); break;
            case 7: this.phaseEnd(); break;
        }
        GameManager.notifications.updateNotice();
        this.status.redraw();
    }

    phaseStart() {
        if(this.delayTime == 0) {
            this.changeBlur(true);
            this.phaseShow.showPhaseStart();
        }
        if(this.delayTime <= 3.0) {
            this.delayTime += 1 / 60;
        }
        if(this.delayTime >= 3.0) {
            this.changeBlur(false);
            this.phaseShow.closeShow();
            this.delayTime = 0;
            GameManager.nowPhase = 1;
        }
    }

    phaseExpress() {
        if(GameManager.needSetup) {
            if(!GameManager.currentCard && GameManager.expIndex != -1) {
                const card = new GameTable_Card(GameManager.player.express[GameManager.expIndex]);
                this.map.addToFrame(card);
                GameManager.currentCard = card;
                GameManager.player.express.splice(GameManager.expIndex, 1);
                GameManager.expIndex = -1;
                this.phaseShow.showExpressConfirm(card);
            }
            if(this.phaseShow.isShowed()) {
                this.phaseShow.updateExpressConfirm();
            }
            this.console.showConsole();
        }
        else if(GameManager.player.express.length != 0 && GameManager.expIndex != -2) {
            const index = GameManager.player.express.findIndex(e => e.time == 0);
            if(index != -1) {
                GameManager.needSetup = true;
                GameManager.expIndex = index;
            }
            else {
                GameManager.expIndex = -2;
            }
        }
        else {
            GameManager.nowPhase = 2;
            GameManager.needSetup = false;
        }
    }

    phaseNews() {
        GameManager.deck.headlines();
        GameManager.nowPhase = 3;
    }

    phaseAction() {
        this.console.showConsole();
        if(GameManager.actionTimes <= 0) {
            GameManager.onBuyingCard = false;
            GameManager.nowPhase = 4;
        }
        switch(GameManager.nowAction) {
            case 0: {
                if(this.phaseShow.isShowed()) {
                    this.phaseShow.closeShow();
                    this.status.redraw();
                    this.zoomBlur.strength = 0.01;
                    this.zoomBlur.enabled = false;
                }
            }
            break;
            case 1: {
                this.zoomBlur.enabled = true;
                if(this.zoomBlur.strength <= 0.5) {
                    this.zoomBlur.strength += 0.05
                }
                this.phaseShow.showMoveSpace();
            }
            break;
            case 2: {
                this.phaseShow.showStartEngine();
            }
            break;
            case 3: {
                this.phaseShow.showInternetAction();
            }
            break;
        }
    }

    phaseDanger() {
        if(!GameManager.danger) {
            GameManager.notifications.pushNotice('本周平安无事。');
        }
        GameManager.nowPhase = 5;
    }

    phaseCost() {
        for(let c of GameManager.player.cards) {
            if(c.data.pay) {
                c.cardPay();
            }
        }
        this.status.redraw();
        GameManager.nowPhase = 6;
    }

    phaseVictory() {
        if(GameManager.player.resources[0].value <= 0) {
            GameManager.ending = '走投无路';
            SceneManager.moveScene(GameScene_End);
        }
        else {
            GameManager.nowPhase = 7;
        }
    }

    phaseEnd() {
        GameManager.expIndex = -1;
        GameManager.news = {
            title: '',
            context: ''
        };
        GameManager.message = null;
        GameManager.actionTimes = 2;
        GameManager.nowAction = 0;
        for(let e of GameManager.player.express) {
            e.time--;
        }
        GameManager.onBuyingCard = false;
        GameManager.nowPhase = 0;
        this.action.activation();
    }

}

//-----------------------------------------------------------
// GameScene_End
//
// 游戏结束场景。
//-----------------------------------------------------------

export class GameScene_End extends GameScene_Base {

    constructor() {
        super();
    }

    create() {
        super.create();
        this.drawBackground();
        this.drawEnd();
        this.setInteraction();
    }

    drawBackground() {
        this.background = new Graphics();
        this.background.beginFill(0x000000);
        this.background.drawRect(0, 0, GameManager.width(), GameManager.height());
        this.background.endFill();
        this.addChild(this.background);
    }

    drawEnd() {
        this.endLabel = null;
        switch(GameManager.ending) {
            case '走投无路': {
                const text = `银河xx月oo日：\n本报讯，我们在${GameManager.player.location}发现了一位不知名死者孤独死在个人空间站中。从现场痕迹来看，可以排除他杀的可能性，负责勘察现场的治安官则断言这名死者不是自杀，初步推断是由于缺乏照料因病渴死在自己家中。目前，警方正在做进一步调查，而知名社会学家隆德·泰勒则发表论文称政府应正视“茧居族”这社会现象及其造成的影响……`
                this.endLabel = GameManager.drawText(text, 0, 0, 30);
            }
            break;
            case '百年合同胜利': {
                //
            }
            break;
            case '异星博物馆胜利': {
                //
            }
            break;
            case '工人胜利': {
                //
            }
            break;
            case '黑手党胜利': {
                //
            }
            break;
        }
        GameManager.autoWrap(this.endLabel, GameManager.width() * 0.8);
        this.endLabel.position.set((GameManager.width() - this.endLabel.width) / 2,
        (GameManager.height() - this.endLabel.height) / 2);
        this.addChild(this.endLabel);
    }

    setInteraction() {
        this.endLabel.interactive = true;
        this.endLabel.on('click', () => {
            this.delayTime = 5;
            this.speed = 0.01;
        });
        this.delayTime = 0;
        this.speed = 0.005;
    }

    update() {
        if(this.delayTime <= 10.0) {
            this.delayTime += 1 / 60;
        }
        if(this.delayTime > 5.0) {
            this.endLabel.alpha -= this.speed;
        }
        if(this.endLabel.alpha <= 0) {
            SceneManager.moveScene(GameScene_Title);
        }
    }

}