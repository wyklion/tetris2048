
var MainScene = cc.Scene.extend({
   onEnter: function () {
      this._super();
      MainScene.instance = this;

      this.initBg();
      this.initMenu();
      this.initSystemMenu();
      this.showHighScore();

      if (GameData.playRateTime >= 7) {
         this.rate();
         GameData.set("playRateTime", 0);
      }
   },
   initBg: function () {
      if (GameData.music) {
         // if (!audio.isMusicPlaying()) {
         //    audio.playMusic("sound/tetrisMusic.mp3", true)
         // }
      }
      var bg = this.bg = cc.Sprite.create(res.p1);
      bg.attr({ x: cx, y: cy });
      this.addChild(bg, 0);
   },
   initMenu: function () {
      // play按钮
      var playButton = this.playButton = new cc.MenuItemImage(
         res.p1play1,
         res.p1play2,
         function () {
            if (GameData.music) {
               audio.playEffect(res.sbutton);
            }
            MainScene.play(true);
         }
      );
      playButton.attr({ x: cx, y: 471 });

      // 休闲模式
      var relaxButton = this.relaxButton = new cc.MenuItemImage(
         res.relax1,
         res.relax2,
         function () {
            if (GameData.music) {
               audio.playEffect(res.sbutton);
            }
            MainScene.play(false);
         }
      );
      relaxButton.attr({ x: cx, y: 370, scale: 0.8 });
      var menu = this.menu = new cc.Menu(playButton, relaxButton);
      menu.x = 0; menu.y = 0;
      this.addChild(menu, 5);
   },
   showHighScore: function () {
      if (GameData.high != 0) {
         var highScore = this.highScore = new cc.LabelTTF(
            "HIGH SCORE:" + GameData.high,
            "Arial-BoldMT",
            30,
            null,
            cc.TEXT_ALIGNMENT_CENTER
         );
         highScore.attr({
            x: cx,
            y: 150,
            color: cc.color(209, 180, 121)
         })
         this.addChild(highScore);
      }
   },
   initSystemMenu: function () {
      var systemY = 235;
      var _this = this;
      // 排行榜
      var topButton = this.topButton = new cc.MenuItemImage(
         res.p1list1,
         res.p1list2,
         function () {
            if (GameData.music) {
               audio.playEffect(res.sbutton);
            }
            _this.showLeaderboard();
         }
      );
      topButton.attr({ x: cx - 130, y: systemY });
      // 去广告
      var storeButton = this.storeButton = new cc.MenuItemImage(
         res.p1shop1,
         res.p1shop2,
         function () {
            if (GameData.music) {
               audio.playEffect(res.sbutton);
            }
            _this.removeAds();
         }
      );
      storeButton.attr({ x: cx, y: systemY });
      // 声音
      var musicButton = this.musicButton = new cc.MenuItemImage(
         GameData.music ? res.p1sound1 : res.p1sound2,
         null,
         function () {
            if (GameData.music) {
               var frame = cc.spriteFrameCache.getSpriteFrame(res.p1sound2);
               _this.musicButton.setNormalSpriteFrame(frame);
               GameData.set("music", 0);
               audio.stopMusic();
            } else {
               audio.playEffect(res.sbutton);
               var frame = cc.spriteFrameCache.getSpriteFrame(res.p1sound1);
               _this.musicButton.setNormalSpriteFrame(frame);
               GameData.set("music", 1);
               // audio.playMusic("sound/tetrisMusic.mp3", isLoop)
            }
         }
      );
      musicButton.attr({ x: cx + 120, y: systemY });
      var menu = this.systemMenu = new cc.Menu(topButton, storeButton, musicButton);
      menu.attr({ x: 0, y: 0 });
      this.addChild(menu);
   },
   /**
    * 菜单禁用开关
    */
   setEnable: function (b) {
      this.menu.setEnabled(b);
      this.systemMenu.setEnabled(b);
   },
   /**
    * 排行榜按钮
    */
   showLeaderboard: function () {
      if (cc.sys.os === cc.sys.OS_IOS) {
         jsb.reflection.callStaticMethod("AppController", "showLeaderboard");
      }
   },
   /** 
    * 去广告按钮
    */
   removeAds: function () {
      this.showRemoveAds();
      //    luaoc.callStaticMethod("AppController", "connectStore", {
      //       callback1 = function()
      //          self:setDisable()
      //       end,
      //       callback2 = function()
      //          self:setEnable()
      //       end,
      //       callbackShow = function()
      //          self:showRemoveAds()
      //       end,
      //       callbackCant = function()
      //          MainScene.cantConnect()
      //       end,
      // })
   },
   /** 
    * 去广告
    */
   showRemoveAds: function () {
      var bg = cc.Sprite.create(res.p1shopW1);
      bg.attr({ x: cx, y: height });
      this.addChild(bg, 10);
      bg.runAction(cc.moveTo(1, cc.p(cx, cy + 90)).easing(cc.easeElasticOut()));

      var y = 217;
      var _this = this;
      var dismissFunc = function () {
         bg.runAction(cc.sequence(
            cc.moveTo(1, cc.p(cx, height)).easing(cc.easeElasticIn()),
            cc.callFunc(function () {
               bg.removeFromParent(true);
            })
         ));
         _this.setEnable(true);
      }

      // 移除广告
      var removeButton = new cc.MenuItemImage(
         cc.sys.language == "zh" ? res.p1shopW3 : res.p1shopW3E,
         null,
         function () {
            if (cc.sys.os === cc.sys.OS_IOS) {

               //   luaoc.callStaticMethod("AppController", "payForLua", {
               //    callSuccess = function ()
               //              MainScene.showSuccessRemoveAds()
               //          end
               // })
            }
            dismissFunc();
         }
      );
      removeButton.attr({ x: 44, y: y });
      removeButton.setAnchorPoint(cc.p(0, 0.5));

      // 恢复购买
      var restoreButton = new cc.MenuItemImage(
         cc.sys.language == "zh" ? res.p1shopW4 : res.p1shopW4E,
         null,
         function () {
            if (cc.sys.os === cc.sys.OS_IOS) {
               //   luaoc.callStaticMethod("AppController", "restoreForLua", {
               // })
            }
            dismissFunc();
         }
      );
      restoreButton.attr({ x: 50, y: y - 78 });
      restoreButton.setAnchorPoint(cc.p(0, 0.5));

      // 取消
      var cancelButton = new cc.MenuItemImage(
         cc.sys.language == "zh" ? res.p1shopW5 : res.p1shopW5E,
         null,
         dismissFunc
      );
      cancelButton.attr({ x: 54, y: y - 151 });
      cancelButton.setAnchorPoint(cc.p(0, 0.5));

      // 关闭
      var xButton = new cc.MenuItemImage(
         res.p1shopW2,
         null,
         dismissFunc
      );
      xButton.attr({ x: 420, y: 280 });

      var menu = new cc.Menu(removeButton, restoreButton, cancelButton, xButton)
      menu.attr({ x: 0, y: 0 });
      bg.addChild(menu);
   },
   /** 
    * 评价
    */
   showRate: function () {
      var bg = cc.Sprite.create(cc.sys.language == "zh" ? res.p41 : resizeBy.p41E);
      bg.attr({ x: cx, y: height });
      this.addChild(bg, 10);
      bg.runAction(cc.moveTo(1, cc.p(cx, cy + 90)).easing(cc.easeElasticOut()));

      var y = 185;
      var _this = this;
      var dismissFunc = function () {
         bg.runAction(cc.sequence(
            cc.moveTo(1, cc.p(cx, height)).easing(cc.easeElasticIn()),
            cc.callFunc(function () {
               bg.removeFromParent(true);
            })
         ));
         _this.setEnable(true);
      }

      // 去评价
      var rateButton = new cc.MenuItemImage(
         cc.sys.language == "zh" ? res.p43 : res.p43E,
         null,
         function () {
            if (cc.sys.os === cc.sys.OS_IOS) {
               jsb.reflection.callStaticMethod("AppController", "rate2");
            }
            dismissFunc();
         }
      );
      rateButton.attr({ x: 62, y: y });
      rateButton.setAnchorPoint(cc.p(0, 0.5));

      // 下次吧
      var nextTimeButton = new cc.MenuItemImage(
         cc.sys.language == "zh" ? res.p44 : res.p44E,
         null,
         dismissFunc
      );
      nextTimeButton.attr({ x: 62, y: y - 67 });
      nextTimeButton.setAnchorPoint(cc.p(0, 0.5));

      //不去
      var neverButton = new cc.MenuItemImage(
         cc.sys.language == "zh" ? res.p45 : res.p45E,
         null,
         function () {
            GameData.set("rate", -1);
            dismissFunc();
         }
      );
      neverButton.attr({ x: 62, y: y - 134 });
      neverButton.setAnchorPoint(cc.p(0, 0.5));

      // 关闭
      var xButton = new cc.MenuItemImage(
         res.p42,
         null,
         dismissFunc
      );
      xButton.attr({ x: 335, y: 300 });
      xButton.setAnchorPoint(cc.p(0.5, 0.5));

      var menu = new cc.Menu(rateButton, nextTimeButton, neverButton, xButton);
      menu.attr({ x: 0, y: 0 });
      bg.addChild(menu);
   },
   rate: function () {
      if (GameData.rate == 0)
         this.showRate();
   },
});

/**
 * 进入游戏
 * @param autoDown 自动下落
 */
MainScene.play = function (autoDown) {
   var transition = new cc.TransitionFade(0.5, new PlayScene(autoDown), cc.color(0, 0, 0));
   cc.director.runScene(transition);
}

/**
 * 返回主界面
 */
MainScene.main = function () {
   var transition = new cc.TransitionFade(0.5, new MainScene(), cc.color(0, 0, 0));
   cc.director.runScene(transition);
}

/**
 * 无法连接
 */
MainScene.cantConnect = function () {
   var scene = cc.director.getRunningScene();
   var bg = new cc.Sprite(cc.sys.language == "zh" ? res.p1shopW6 : res.p1shopW6E);
   bg.attr({ x: cx, y: height });
   scene.addChild(bg, 10);
   // 关闭按钮
   var xButton = new cc.MenuItemImage(
      res.p1shopW7,
      null,
      function () {
         var action = cc.moveTo(1, cc.p(cx, height)).easing(cc.easeElasticIn());
         var func = cc.callFunc(function () { bg.removeFromParent(true) });
         bg.runAction(cc.sequence(action, func));
         scene.setEnable(true);
      }
   );
   xButton.attr({ x: 420, y: 90 });
   var xMmenu = new cc.Menu(xButton);
   xMmenu.attr({ x: 0, y: 0 });
   bg.addChild(xMmenu);

   var action = cc.moveTo(1, cc.p(cx, cy + 90)).easing(cc.easeElasticOut());
   bg.runAction(action);
}

/**
 * 成功去除广告
 */
MainScene.showSuccessRemoveAds = function () {
   var scene = MainScene.instance;
   var bg = new cc.Sprite(res.p1shopW1);
   bg.setPosition(cx, height);
   scene.addChild(bg, 10);
   bg.runAction(cc.moveTo(1, cc.p(cx, cy + 90)).easing(cc.easeElasticOut()));

   var closeFunc = function () {
      var action = cc.moveTo(1, cc.p(cx, height)).easing(cc.easeElasticIn());
      var func = cc.callFunc(function () { bg.removeFromParent(true) });
      bg.runAction(cc.sequence(action, func));
      scene.setEnable(true);
   }
   var image = cc.sys.language == "zh" ? res.p1shopW5 : res.p1shopW5E;
   var cancelButton = new cc.MenuItemImage(
      image,
      null,
      closeFunc
   );
   cancelButton.setPosition(54, 150);
   cancelButton.setAnchorPoint(cc.p(0, 0.5));

   // 关闭按钮
   var xButton = new cc.MenuItemImage(
      res.p1shopW2,
      null,
      closeFunc
   );
   xButton.attr({ x: 420, y: 280 });
   var menu = new cc.Menu(cancelButton, xButton);
   menu.attr({ x: 0, y: 0 });
   bg.addChild(menu);
}