
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

      //开始
      this.start();
      tetris.getNextNumer();

      cc.eventManager.addListener({
         event: cc.EventListener.TOUCH_ONE_BY_ONE,
         swallowTouches: true,
         onTouchBegan: this.onTouchBegan.bind(this),
         onTouchMoved: this.onTouchMoved.bind(this),
         onTouchEnded: this.onTouchEnded.bind(this),
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

      var menu = this.menu = new cc.Menu(returnButton, suspendButton);
      menu.attr({ x: 0, y: 0 });
      this.addChild(menu);


      //RELAX标记
      if (!this.autoDown) {
         var relaxLabel = this.relaxLabel = new cc.LabelTTF(
            "RELAX",
            "Arial-BoldMT",
            28,
            null,
            cc.TEXT_ALIGNMENT_CENTER,
         );
         relaxLabel.attr({
            x: cx - 155,
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
      //    self.levelLabel = ui.newTTFLabel({
      //       text = "Lv 1",
      //       size = 50,
      //       align = ui.TEXT_ALIGN_CENTER,
      //       x = 100,
      //       y = display.height - 100
      //    })
      // self: addChild(self.levelLabel)
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
      this.menu.setEnabled(false);
      var suspendLayer = new cc.Node();
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
            _this.menu.setEnabled(true);
            _this.scheduleUpdate();
            _this.isSuspend = false;
            suspendLayer.removeFromParent(true);
         });
      // resumeButton.attr({ x: cx, y: cy });
      this.resumeMenu = new cc.Menu(resumeButton);
      suspendLayer.addChild(this.resumeMenu);
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

      var tetris = tetris;
      // 自动掉落模式
      if (this.autoDown) {
         tetris.passTime = tetris.passTime + dt;
         if (tetris.passTime > tetris.speed) {
            tetris.passTime = 0;
            tetris.dropOneRow();
         }
      }
   },
   onTouchBegan: function (touch, event) {
      if (this.isSuspend || gameState != "RUN") return;
      this.touchControl = true;
      this.moveTime = 0;
      this.moved = false;
      this.moveDx = 0;
      this.touchPos = touch.getLocationInView();
      return false;

   },
   onTouchMoved: function (touch, event) {
      // 移动当前按钮精灵的坐标位置
      var target = event.getCurrentTarget();
      var delta = touch.getDelta();
      var dx = delta.x;
      var dy = delta.y;
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
      var pos = touch.getLocationInView();
      var dx = pos.x - this.touchPos.x;
      var dy = pos.y - this.touchPos.y;
      if (dy < -BASESIZE * 0.5) {
         this.tetris.drop();
      }
      // else{
      //    --[[1.2.1取消点击最下一行掉落
      // 	if y < display.height * 0.5 - ROW * BASESIZE * 0.5 + BASESIZE  then
      // self.tetris: drop()
      //    else]]
      // }
      if (this.moveTime < 0.5) {
         if (x < cx) {
            this.tetris.move("left");
         }
         else {
            this.tetris.move("right");
         }
      }
   },
   share: function () {

      //       if self.autoDown then
      //       luaoc.callStaticMethod("AppController", "share",
      //          { relax = false, score = self.tetris.score })
      // else
      //    luaoc.callStaticMethod("AppController", "share",
      //          { relax = true, score = self.tetris.score })
      // end
   },
   gameOver: function () {
      var tetris = this.tetris;
      this.tetris.clearRecord();
      this.unscheduleUpdate();
      if (GameData.music) audio.playEffect(SOUND.dead);
      gameState = "GAMEOVER";
      //禁掉按钮
      this.menu.setEnabled(false);

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
         cc.TEXT_ALIGNMENT_CENTER,
      );
      scoreLabel.attr({ x: cx, y: cy + 100 });
      overLayer.addChild(scoreLabel);
      if (this.autoDown) {
         //最高分
         GameData.high = GameData.high || 0
         if (tetris.score > GameData.high) {
            GameData.high = tetris.score;
         }
      }
      else {
         //休闲最高分
         GameData.relaxHigh = GameData.relaxHigh || 0
         if (tetris.score > GameData.relaxHigh) {
            GameData.relaxHigh = tetris.score;
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
         cc.TEXT_ALIGNMENT_CENTER,
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
            _this.menu.setEnabled(true);
            _this.start();
         }
      );
      againButton.attr({ x: cx, y: cy - 120 });

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

      this.overMenu = cc.Menu(returnButton, againButton, shareButton);
      overLayer.addChild(this.overMenu);

      this.overMenu.setScale(0)
      this.overMenu.setEnabled(false);

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
               _this.overMenu.setEnabled(true);
            }, delay);
         })
      ));
      this.afterGameover();
   },
   afterGameover: function () {
      //gamecenter最高分
      if (this.autoDown) {
         // luaoc.callStaticMethod("AppController", "commitScore", 
         //    {relax = false, score = GameData.high})
      }
      else {
         // luaoc.callStaticMethod("AppController", "commitScore", 
         //    {relax = true, score = GameData.relaxHigh})
      }
      //插页广告
      GameData.adTime = GameData.adTime || 0
      GameData.adTime = GameData.adTime + 1;
      if (GameData.adTime == 2) {
         // luaoc.callStaticMethod("AppController", "showAd", {
         //    callback1 = function()
         //       self:cantTouch()
         //    end,
         //    callback2 = function()
         //       --控制操作
         //       self:canTouch()
         //    end})
         GameData.adTime = 0;
      }
      //游戏次数
      GameData.playRateTime = GameData.playRateTime || 6;
      GameData.playRateTime = GameData.playRateTime + 1;
      GameState.save(GameData);
   },
});


