
var PlayScene = cc.Scene.extend({
   ctor: function (autoDown) {
      this._super();
      this.autoDown = autoDown;
   },
   onEnter: function () {
      this._super();

      this.init();
      this.isSuspend = false;

      //主要内容页
      var tetris = this.tetris = new TetrisLayer();
      tetris.setPosition(cx, cy);
      tetris.setAnchorPoint(cc.p(0.5, 0.5));
      tetris.ignoreAnchorPointForPosition(false);
      this.addChild(tetris);
      tetris.scene = this;

      //开始
      tetris.getNextNumer();
      this.start();

      cc.eventManager.addListener({
         event: cc.EventListener.TOUCH_ONE_BY_ONE,
         swallowTouches: true,
         onTouchBegan: this.onTouchBegan.bind(this),
         onTouchMoved: this.onTouchMoved.bind(this),
         onTouchEnded: this.onTouchEnded.bind(this),
      }, this);
      cc.eventManager.addListener({
         event: cc.EventListener.KEYBOARD,
         onKeyPressed: this.onKeyPressed.bind(this),
      }, this);
   },
   init: function () {
      var _this = this;
      // 背景
      var bg = this.bg = cc.Sprite.create(res.p2);
      bg.attr({ x: cx, y: cy });
      this.addChild(bg, 0);

      // 返回按钮
      var returnButton = this.returnButton = new cc.MenuItemImage(
         res.back1,
         res.back2,
         function () {
            if (GameData.music) {
               audio.playEffect(res.sbutton);
            }
            MainScene.main();
         });
      returnButton.attr({ x: left + 60, y: height - 50 });
      var menu1 = this.menu1 = new cc.Menu(returnButton);
      menu1.attr({ x: 0, y: 0 });
      this.addChild(menu1);
      // 暂停按钮
      var suspendButton = this.suspendButton = new cc.MenuItemImage(
         res.stop1,
         res.stop2,
         function () {
            if (GameData.music) {
               audio.playEffect(res.sbutton);
            }
            _this.suspend();
         });
      suspendButton.attr({ x: right - 60, y: height - 50 });
      var menu2 = this.menu2 = new cc.Menu(suspendButton);
      menu2.attr({ x: 0, y: 0 });
      this.addChild(menu2);


      //RELAX标记
      if (!this.autoDown) {
         var relaxLabel = this.relaxLabel = new cc.LabelTTF(
            "RELAX",
            "Arial-BoldMT",
            22,
            null,
            cc.TEXT_ALIGNMENT_CENTER
         );
         relaxLabel.attr({
            x: Math.max(cx - 180, left + 120),
            y: height - 50,
            color: cc.color(255, 254, 194),
         })
         this.addChild(relaxLabel);
      }
      // 分数
      var scoreLabel = this.scoreLabel = new cc.LabelTTF(
         "0",
         "Arial-BoldMT",
         46,
         null,
         cc.TEXT_ALIGNMENT_CENTER
      );
      scoreLabel.attr({ x: cx, y: height - 50 });
      this.addChild(scoreLabel);

      // --等级
      // --[[
      //    this.levelLabel = ui.newTTFLabel({
      //       text = "Lv 1",
      //       size = 50,
      //       align = ui.TEXT_ALIGN_CENTER,
      //       x = 100,
      //       y = display.height - 100
      //    })
      // this: addChild(this.levelLabel)
      // --]]
      // 下一块
      var nextSprite = new cc.Sprite(res.next);
      nextSprite.attr({ x: cx + (right - cx) * 0.5, y: height - 50 });
      this.addChild(nextSprite, 1);
   },
   suspend: function () {
      var _this = this;
      this.unscheduleUpdate();
      this.isSuspend = true;
      this.menu2.setEnabled(false);
      var suspendLayer = this.suspendLayer = new cc.Node();
      this.addChild(suspendLayer, 3);
      var bg = new cc.Sprite(res.p3);
      bg.attr({ x: cx, y: cy });
      suspendLayer.addChild(bg);
      // 继续按钮
      var resumeButton = new cc.MenuItemImage(
         res.p3stop,
         null,
         function () {
            if (GameData.music) {
               audio.playEffect(res.sbutton);
            }
            _this.resumeGame();
         });
      // resumeButton.attr({ x: cx, y: cy });
      this.resumeMenu = new cc.Menu(resumeButton);
      suspendLayer.addChild(this.resumeMenu);
   },
   resumeGame: function () {
      this.menu2.setEnabled(true);
      this.scheduleUpdate();
      this.isSuspend = false;
      this.suspendLayer.removeFromParent(true);
   },
   setNext: function (num) {
      if (this.nextPic) {
         this.nextPic.removeFromParent(true);
      }
      this.nextPic = this.tetris.getNumerSprite(num);
      this.nextPic.setPosition(cx + (right - cx) * 0.5, height - 50);
      this.nextPic.setScale(0.63);
      this.addChild(this.nextPic);
   },
   start: function () {
      this.tetris.start();
      if (!this.tetris.isLoad) {
         this.scheduleUpdate();
      }
      else if (this.autoDown) {
         this.suspend();
      }
   },
   update: function (dt) {
      if (gameState != "RUN")
         return;
      if (!this.touchControl)
         this.moveTime = this.moveTime + dt;

      var tetris = this.tetris;
      // 自动掉落模式
      if (this.autoDown) {
         tetris.passTime = tetris.passTime + dt;
         if (tetris.passTime > tetris.speed) {
            tetris.passTime = 0;
            tetris.dropOneRow();
         }
      }
   },
   onKeyPressed: function (keyCode, event) {
      // console.log(keyCode);
      if (keyCode == 32 || keyCode == 13) {//空格或回车
         if (!this.isSuspend)
            this.suspend();
         else
            this.resumeGame();
      }
      if (this.isSuspend || gameState != "RUN") return;
      if (keyCode == 37) {
         this.tetris.move("left");
      } else if (keyCode == 39) {
         this.tetris.move("right");
      } else if (keyCode == 40) {
         this.tetris.drop();
      }
   },
   onTouchBegan: function (touch, event) {
      if (this.isSuspend || gameState != "RUN") return false;
      this.touchControl = true;
      this.moveTime = 0;
      this.moved = false;
      this.moveDx = 0;
      this.touchPos = touch.getLocation();
      return true;

   },
   onTouchMoved: function (touch, event) {
      // 移动当前按钮精灵的坐标位置
      var target = event.getCurrentTarget();
      var pos = touch.getLocation();
      var dx = pos.x - this.touchPos.x;
      var dy = pos.y - this.touchPos.y;
      // console.log("move:", dx, dy);
      if (Math.abs(dy) > Math.abs(dx))
         return;

      var moveDx = 0;
      if (dx < 0)
         moveDx = Math.ceil(dx / BASESIZE - 0.5);
      else
         moveDx = Math.floor(dx / BASESIZE + 0.5);
      if (moveDx - this.moveDx < 0) {
         for (var i = 0; i < this.moveDx - moveDx; i++) {
            this.tetris.move("left");
            this.moved = true;
         }
      }
      else if (moveDx - this.moveDx > 0) {
         for (var i = 0; i < moveDx - this.moveDx; i++) {
            this.tetris.move("right");
            this.moved = true;
         }
      }
      this.moveDx = moveDx;
   },
   onTouchEnded: function (touch, event) {
      this.touchControl = false
      if (this.moved)
         return;
      var pos = touch.getLocation();
      var dx = pos.x - this.touchPos.x;
      var dy = pos.y - this.touchPos.y;
      if (dy < -BASESIZE * 0.5) {
         this.tetris.drop();
      }
      else {
         //    --[[1.2.1取消点击最下一行掉落
         // 	if y < display.height * 0.5 - ROW * BASESIZE * 0.5 + BASESIZE  then
         // this.tetris: drop()
         //    else]]
         // }
         if (this.moveTime < 0.5) {
            if (pos.x < cx) {
               this.tetris.move("left");
            }
            else {
               this.tetris.move("right");
            }
         }
      }
   },
   share: function () {
      if (cc.sys.os === cc.sys.OS_IOS) {
         jsb.reflection.callStaticMethod("AppController", "share:relax:", this.tetris.score, !this.autoDown);
      }
   },
   gameOver: function () {
      var tetris = this.tetris;
      this.tetris.clearRecord();
      this.unscheduleUpdate();
      if (GameData.music) audio.playEffect(res.sdead);
      gameState = "GAMEOVER";
      //禁掉按钮
      this.menu2.setEnabled(false);

      var overLayer = new cc.Node();
      this.addChild(overLayer, 3);
      var bg = new cc.Sprite(res.p3);
      bg.attr({ x: cx, y: cy });
      overLayer.addChild(bg);;
      //bg.setOpacity(128);

      //score
      var scoreLabel = new cc.LabelTTF(
         "" + this.tetris.score,
         "Arial-BoldMT",
         72,
         null,
         cc.TEXT_ALIGNMENT_CENTER
      );
      scoreLabel.attr({ x: cx, y: cy + 100 });
      overLayer.addChild(scoreLabel);
      if (this.autoDown) {
         //最高分
         if (tetris.score > GameData.high) {
            GameData.set("high", tetris.score);
         }
      }
      else {
         //休闲最高分
         if (tetris.score > GameData.relaxHigh) {
            GameData.set("relaxHigh", tetris.score);
         }
      }
      //best
      var highText;
      if (this.autoDown)
         highText = "HIGH SCORE:" + GameData.high;
      else
         highText = "HIGH SCORE:" + GameData.relaxHigh;

      var bestLabel = new cc.LabelTTF(
         highText,
         "Arial-BoldMT",
         30,
         null,
         cc.TEXT_ALIGNMENT_CENTER
      );
      bestLabel.attr({ x: cx, y: cy });
      overLayer.addChild(bestLabel);
      //returnButton
      var returnButton = new cc.MenuItemImage(
         res.p3home1,
         res.p3home2,
         function () {
            if (GameData.music) {
               audio.playEffect(res.sbutton);
            }
            MainScene.main();
         }
      );
      returnButton.attr({ x: cx - 150, y: cy - 120 });
      returnButton.setScale(0);

      var _this = this;
      //againButton
      var againButton = new cc.MenuItemImage(
         res.p3retry1,
         res.p3retry2,
         function () {
            if (GameData.music) {
               audio.playEffect(res.sbutton);
            }
            overLayer.removeFromParent(true);
            //启用按钮
            _this.menu2.setEnabled(true);
            _this.start();
         }
      );
      againButton.attr({ x: cx, y: cy - 120 });
      againButton.setScale(0);

      //shareButton
      var shareButton = new cc.MenuItemImage(
         res.p3share1,
         res.p3share2,
         function () {
            if (GameData.music) {
               audio.playEffect(res.sbutton);
            }
            _this.share();
         }
      );
      shareButton.attr({ x: cx + 150, y: cy - 120 });
      shareButton.setScale(0);

      var overMenu = this.overMenu = new cc.Menu(returnButton, againButton, shareButton);
      overLayer.addChild(overMenu);
      overMenu.attr({ x: 0, y: 0 });
      overMenu.setEnabled(false);

      bestLabel.setVisible(false);
      scoreLabel.setScale(0);
      var delay = 0;
      this.runAction(cc.sequence(
         //CCFadeIn:create(0.5),
         cc.callFunc(function () {
            scoreLabel.runAction(cc.sequence(
               cc.delayTime(delay),
               cc.scaleTo(0.2, 1.2),
               cc.scaleTo(0.2, 1)
            ));
            delay = delay + 0.4;
         }),
         cc.callFunc(function () {
            bestLabel.runAction(cc.sequence(
               cc.delayTime(delay),
               cc.fadeIn(0.2),
               cc.callFunc(function () {
                  bestLabel.setVisible(true);
               })
            ));
            delay = delay + 0.2;
         }),
         cc.callFunc(function () {
            returnButton.runAction(cc.sequence(
               cc.delayTime(delay),
               cc.scaleTo(0.1, 1.1),
               cc.scaleTo(0.1, 1)
            ));
            delay = delay + 0.2;
         }),
         cc.callFunc(function () {
            againButton.runAction(cc.sequence(
               cc.delayTime(delay),
               cc.scaleTo(0.1, 1.1),
               cc.scaleTo(0.1, 1)
            ));
            delay = delay + 0.2;
         }),
         cc.callFunc(function () {
            shareButton.runAction(cc.sequence(
               cc.delayTime(delay),
               cc.scaleTo(0.1, 1.1),
               cc.scaleTo(0.1, 1)
            ));
            delay = delay + 0.2;
         }),
         cc.callFunc(function () {
            _this.scheduleOnce(function () {
               overMenu.setEnabled(true);
            }, delay);
         })
      ));
      this.afterGameover();
   },
   afterGameover: function () {
      //gamecenter最高分
      if (this.autoDown) {
         if (cc.sys.os === cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod("AppController", "commitScore:withRelax:", GameData.high, false);
         }
         //插页广告
         GameData.set("adTime", GameData.adTime + 1);
         if (GameData.adTime == 2) {
            if (cc.sys.os === cc.sys.OS_IOS) {
               jsb.reflection.callStaticMethod("AppController", "showAd");
            }
            GameData.set("adTime", 0);
         }
      }
      else {
         if (cc.sys.os === cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod("AppController", "commitScore:withRelax:", GameData.relaxHigh, true);
            //插页广告
            jsb.reflection.callStaticMethod("AppController", "showAd");
         }
      }
      //游戏次数
      GameData.set("playRateTime", GameData.playRateTime + 1);
   },
});


