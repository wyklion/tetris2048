/**
 * 主界面
 */
var MainScene = window.MainScene = cc.Scene.extend({
   onEnter: function () {
      this._super();
      MainScene.instance = this;
      MainScene.size = size;

      var cache = cc.spriteFrameCache;
      cache.addSpriteFrames(res.atlasPlist, res.atlas);

      this.initBg();
      this.initMenu();
      this.initSystemMenu();
      this.showHighScore();

      if (cc.sys.isNative) {
         if (GameData.playRateTime >= 7) {
            this.rate();
            GameData.set("playRateTime", 0);
         }
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
   /**
    * PLAY/RELAX按钮
    */
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
   /**
    * 显示最高分
    */
   showHighScore: function () {
      if (GameData.high != 0) {
         var highScore = this.highScore = new cc.LabelTTF(
            (!isChinese ? "HIGH SCORE:" : "最高分:") + GameData.high,
            boldFontName,
            30,
            null,
            cc.TEXT_ALIGNMENT_CENTER
         );
         highScore.attr({
            x: cx,
            y: 150
         })
         highScore.setColor(cc.color(255, 255, 224, 255));
         this.addChild(highScore);
         if (isWeixinGame) {
            highScore.attr({ y: height - 80 });
         }
      }
      if (GameData.relaxHigh != 0) {
         var relaxHighScore = this.highScore = new cc.LabelTTF(
            (!isChinese ? "RELAX HIGH SCORE:" : "休闲最高分:") + GameData.relaxHigh,
            "Arial",
            24,
            null,
            cc.TEXT_ALIGNMENT_CENTER
         );
         relaxHighScore.attr({
            x: cx,
            y: 120
         })
         relaxHighScore.setColor(cc.color(255, 255, 224, 255));
         this.addChild(relaxHighScore);
         if (isWeixinGame) {
            relaxHighScore.attr({ y: height - 110 });
         }
      }
   },
   /**
    * 排行／去广告／声音开关
    */
   initSystemMenu: function () {
      var systemY = 235;
      var _this = this;
      var topButton, storeButton;
      // 排行榜
      topButton = this.topButton = new cc.MenuItemImage(
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
      if (!isWeixinGame) {
         // 去广告
         storeButton = this.storeButton = new cc.MenuItemImage(
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
      }
      // 声音
      var musicButton1 = this.musicButton1 = new cc.MenuItemImage(
         res.p1sound1,
         res.p1sound1,
         function () {
            _this.toggleSound();
         }
      );
      musicButton1.attr({ x: cx + 120, y: systemY });
      musicButton1.setVisible(GameData.music ? true : false);
      var musicButton2 = this.musicButton2 = new cc.MenuItemImage(
         res.p1sound2,
         res.p1sound2,
         function () {
            _this.toggleSound();
         }
      );
      musicButton2.attr({ x: cx + 120, y: systemY });
      musicButton2.setVisible(GameData.music ? false : true);

      var menu;
      if (isWeixinGame) {
         topButton.attr({ x: cx - 80, y: systemY });
         musicButton1.attr({ x: cx + 80, y: systemY });
         musicButton2.attr({ x: cx + 80, y: systemY });
         menu = this.systemMenu = new cc.Menu(topButton, musicButton1, musicButton2);
      }
      else
         menu = this.systemMenu = new cc.Menu(topButton, storeButton, musicButton1, musicButton2);
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
      if (cc.sys.isNative) {
         if (cc.sys.os === cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod("AppController", "showLeaderboard");
         }
      }
      else if (isWeixinGame) {
         // 微信排行榜
         window.openRankList(this, size);
      }
      else {
         webShow(this);
      }
   },
   /**
    * 声音开关
    */
   toggleSound: function () {
      if (GameData.music) {
         this.musicButton1.setVisible(false);
         this.musicButton2.setVisible(true);
         GameData.set("music", 0);
         audio.stopMusic();
      } else {
         audio.playEffect(res.sbutton);
         this.musicButton2.setVisible(false);
         this.musicButton1.setVisible(true);
         GameData.set("music", 1);
         // audio.playMusic("sound/tetrisMusic.mp3", isLoop)
      }
   },
   /** 
    * 去广告按钮
    */
   removeAds: function () {
      // 流程改了，直接显示，不从oc回调了。
      if (cc.sys.isNative) {
         this.showRemoveAds();
      }
      else {
         webShow(this);
      }
      // if (cc.sys.os === cc.sys.OS_IOS) {
      //    this.setEnable(false);
      //    jsb.reflection.callStaticMethod("AppController", "connectStore");
      // }
   },
   /** 
    * 去广告
    */
   showRemoveAds: function () {
      this.setEnable(false);
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

      var img;
      // 移除广告
      img = isChinese ? res.p1shopW3 : res.p1shopW3E;
      var removeButton = new cc.MenuItemImage(
         img,
         img,
         function () {
            if (cc.sys.os === cc.sys.OS_IOS) {
               jsb.reflection.callStaticMethod("AppController", "removeButton");
            }
            dismissFunc();
         }
      );
      removeButton.attr({ x: 44, y: y });
      removeButton.setAnchorPoint(cc.p(0, 0.5));

      // 恢复购买
      img = isChinese ? res.p1shopW4 : res.p1shopW4E;
      var restoreButton = new cc.MenuItemImage(
         img,
         img,
         function () {
            if (cc.sys.os === cc.sys.OS_IOS) {
               jsb.reflection.callStaticMethod("AppController", "restoreButton");
            }
            dismissFunc();
         }
      );
      restoreButton.attr({ x: 50, y: y - 78 });
      restoreButton.setAnchorPoint(cc.p(0, 0.5));

      // 取消
      img = isChinese ? res.p1shopW5 : res.p1shopW5E;
      var cancelButton = new cc.MenuItemImage(
         img,
         img,
         dismissFunc
      );
      cancelButton.attr({ x: 54, y: y - 151 });
      cancelButton.setAnchorPoint(cc.p(0, 0.5));

      // 关闭
      var xButton = new cc.MenuItemImage(
         res.p1shopW2,
         res.p1shopW2,
         dismissFunc
      );
      xButton.attr({ x: 420, y: 280 });

      var menu = new cc.Menu(removeButton, restoreButton, cancelButton, xButton)
      menu.attr({ x: 0, y: 0 });
      bg.addChild(menu);
   },
   /**
    * 成功移除广告，这个不用了。
    */
   successRemoveAds: function () {
      var _this = this;
      var bg = new cc.Sprite(res.p1shopW1);
      bg.setPosition(cx, height);
      this.addChild(bg, 10);
      bg.runAction(cc.moveTo(1, cc.p(cx, cy + 90)).easing(cc.easeElasticOut()));

      var closeFunc = function () {
         var action = cc.moveTo(1, cc.p(cx, height)).easing(cc.easeElasticIn());
         var func = cc.callFunc(function () { bg.removeFromParent(true) });
         bg.runAction(cc.sequence(action, func));
         _this.setEnable(true);
      }
      var image = isChinese ? res.p1shopW5 : res.p1shopW5E;
      var cancelButton = new cc.MenuItemImage(
         image,
         image,
         closeFunc
      );
      cancelButton.setPosition(54, 150);
      cancelButton.setAnchorPoint(cc.p(0, 0.5));

      // 关闭按钮
      var xButton = new cc.MenuItemImage(
         res.p1shopW2,
         res.p1shopW2,
         closeFunc
      );
      xButton.attr({ x: 420, y: 280 });
      var menu = new cc.Menu(cancelButton, xButton);
      menu.attr({ x: 0, y: 0 });
      bg.addChild(menu);
   },
   /**
    * 无法连接商店
    */
   cantConnect: function () {
      var _this = this;
      var bg = new cc.Sprite(isChinese ? res.p1shopW6 : res.p1shopW6E);
      bg.attr({ x: cx, y: height });
      this.addChild(bg, 10);
      // 关闭按钮
      var xButton = new cc.MenuItemImage(
         res.p1shopW7,
         res.p1shopW7,
         function () {
            var action = cc.moveTo(1, cc.p(cx, height)).easing(cc.easeElasticIn());
            var func = cc.callFunc(function () { bg.removeFromParent(true) });
            bg.runAction(cc.sequence(action, func));
            _this.setEnable(true);
         }
      );
      xButton.attr({ x: 420, y: 90 });
      var xMmenu = new cc.Menu(xButton);
      xMmenu.attr({ x: 0, y: 0 });
      bg.addChild(xMmenu);

      var action = cc.moveTo(1, cc.p(cx, cy + 90)).easing(cc.easeElasticOut());
      bg.runAction(action);
   },
   /** 
    * 评价
    */
   showRate: function () {
      this.setEnable(false);
      var bg = cc.Sprite.create(isChinese ? res.p41 : res.p41E);
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

      var img;
      // 去评价
      img = isChinese ? res.p43 : res.p43E;
      var rateButton = new cc.MenuItemImage(
         img,
         img,
         function () {
            if (cc.sys.os === cc.sys.OS_IOS) {
               jsb.reflection.callStaticMethod("AppController", "rate");
            }
            dismissFunc();
         }
      );
      rateButton.attr({ x: 62, y: y });
      rateButton.setAnchorPoint(cc.p(0, 0.5));

      // 下次吧
      img = isChinese ? res.p44 : res.p44E;
      var nextTimeButton = new cc.MenuItemImage(
         img,
         img,
         dismissFunc
      );
      nextTimeButton.attr({ x: 62, y: y - 67 });
      nextTimeButton.setAnchorPoint(cc.p(0, 0.5));

      //不去
      img = isChinese ? res.p45 : res.p45E;
      var neverButton = new cc.MenuItemImage(
         img,
         img,
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
         res.p42,
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
   // 隐藏游戏圈按钮
   if (isWeixinGame) {
      GameClubButton.hide();
   }
   var transition = new cc.TransitionFade(0.5, new PlayScene(autoDown), cc.color(0, 0, 0));
   cc.director.runScene(transition);
}

/**
 * 返回主界面
 */
MainScene.main = function () {
   var transition = new cc.TransitionFade(0.5, new MainScene(), cc.color(0, 0, 0));
   cc.director.runScene(transition);
   // 显示游戏圈按钮
   if (isWeixinGame) {
      GameClubButton.show();
   }
}


/**
 * 网页版弹出
 */
var webShow = function (scene) {
   scene.setEnable(false);
   var bg = cc.Sprite.create(res.p1shopW1);
   bg.attr({ x: cx, y: height });
   scene.addChild(bg, 10);
   bg.runAction(cc.moveTo(1, cc.p(cx, cy + 90)).easing(cc.easeElasticOut()));

   var y = 217;
   var _this = scene;
   var dismissFunc = function () {
      bg.runAction(cc.sequence(
         cc.moveTo(1, cc.p(cx, height)).easing(cc.easeElasticIn()),
         cc.callFunc(function () {
            bg.removeFromParent(true);
         })
      ));
      _this.setEnable(true);
   }
   // 内容
   var note = new cc.LabelTTF(
      isChinese ? "网页不支持分享功能\n请在ios平台或微信小程序\n搜索\"俄罗斯方块2048\"" : "Only open for ios and WeiChat version",
      boldFontName,
      30,
      null,
      cc.TEXT_ALIGNMENT_CENTER
   );
   note.setColor(cc.color(255, 165, 80, 255));
   note.attr({ x: 200, y: 180 });
   bg.addChild(note);
   // 前往
   var goButton = new cc.MenuItemFont(isChinese ? "前往苹果商店" : "Go to App store", function () {
      dismissFunc();
      window.open("https://itunes.apple.com/" + (isChinese ? "cn" : "us") + "/app/tetris2048/id875196147?ls=1&mt=8");
   }, scene);
   goButton.setFontSize(25);
   goButton.setColor(cc.color(166, 80, 255, 255));
   goButton.attr({ x: 200, y: 80 });
   // 关闭
   var xButton = new cc.MenuItemImage(
      res.p1shopW2,
      res.p1shopW2,
      dismissFunc
   );
   xButton.attr({ x: 420, y: 280 });

   var menu = new cc.Menu(goButton, xButton);
   menu.attr({ x: 0, y: 0 });
   bg.addChild(menu);
};

/**
 * ios回调接口，回调不了不用了
 */
var showRemoveAds = function () {
   MainScene.instance.showRemoveAds();
}
/**
 * ios回调接口，回调不了不用了
 */
var cantConnect = function () {
   MainScene.instance.cantConnect();
}
