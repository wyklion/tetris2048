
var MainScene = cc.Scene.extend({
   onEnter: function () {
      this._super();

      // 初始化
      size = cc.director.getWinSize();
      left = size.width > 720 ? (size.width - 720) / 2 : 0;
      right = size.width > 720 ? (size.width + 720) / 2 : size.width;
      cx = size.width / 2;
      cy = size.height / 2;
      height = size.height;

      this.initBg();
      this.initMenu();
      this.initSystemMenu();
      this.showHighScore();

      GameData.playRateTime = GameData.playRateTime || 6;
      if (GameData.playRateTime >= 7) {
         this.rate();
         GameData.playRateTime = 0;
      }
   },
   initBg: function () {
      if (GameData.music == null) {
         GameData.music = true;
      }
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
      if (GameData.high != null) {
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
            MainScene.cantConnect();
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
               _this.musicButton.setNormalSpriteFrame(res.p1sound2);
               GameData.music = false;
               // GameState.save(GameData)
               audio.stopMusic();
            } else {
               audio.playEffect(res.sbutton);
               _this.musicButton.setNormalSpriteFrame(res.p1sound1);
               GameData.music = true;
               // GameState.save(GameData)
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
    * 去广告
    */
   showRemoveAds: function () {

   },
   /** 
    * 去广告
    */
   removeAds: function () {

   },
   /** 
    * 评价
    */
   showRate: function () {

   },
   rate: function () {
      GameData.rate = GameData.rate || "yes";
      if (GameData.rate == "yes") then
      this.showRate()
   },
   /**
    * 排行榜
    */
   showLeaderboard: function () {

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
   var layer = cc.director.getRunningScene().children[0];
   var bg = new cc.Sprite(cc.sys.language == "zh" ? res.p1showW6 : res.p1showW6E);
   bg.attr({ x: cx, y: height });
   layer.addChild(bg, 10);
   // 关闭按钮
   var xButton = new cc.MenuItemImage(
      res.p1showW7,
      null,
      function () {
         var action = cc.moveTo(1, cc.p(cx, top)).easing(cc.easeElasticIn());
         var func = cc.callFunc(function () { bg.removeFromParent(true) });
         bg.runAction(cc.sequence(action, func));
         layer.setEnable(true);
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

}
