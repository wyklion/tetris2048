require('libs/weapp-adapter-min');

// 这里需要先加载微信脚本，不然 window 对象会报错
window.REMOTE_SERVER_ROOT = '';//远程服务器地址

var Parser = require('libs/xmldom/dom-parser');
window.DOMParser = Parser.DOMParser;
require('weapp-adapter');
require('game.min');

// 系统信息
var systemInfo = wx.getSystemInfoSync();
// 广告条
var { screenWidth, screenHeight, windowWidth, windowHeight, pixelRatio } = systemInfo;
var height = windowHeight * 0.15;
var lastBanner;
var createBanner = function () {
   var bannerAd = wx.createBannerAd({
      adUnitId: 'adunit-c0ee23e59d3ce0ae',
      style: {
         left: 0, top: 0,
         width: 320,
      }
   })
   bannerAd.onResize(res => {
      bannerAd.style.left = (windowWidth - bannerAd.style.realWidth) * 0.5 + 0.1;
      bannerAd.style.top = windowHeight - bannerAd.style.realHeight + 0.1;
      /*if (bannerAd.style.realHeight > height) {
         bannerAd.style.width = windowWidth * height / bannerAd.style.realHeight;
      }*/
   })
   bannerAd.onLoad(() => {
      if (lastBanner) {
         lastBanner.destroy();
      }
      lastBanner = bannerAd;
   });
   bannerAd.onError((e) => {
      console.log(e);
   });
   bannerAd.show();
}
createBanner();
setInterval(() => {
   createBanner();
}, 30000)

// 分享
var height2 = windowHeight * 0.153;
wx.showShareMenu({
   withShareTicket: true
})
wx.onShareAppMessage(function () {
   return {
      title: '俄罗斯方块2048',
      imageUrl: 'res/pic.jpg',
      // imageUrl: canvas.toTempFilePathSync({
      //    x: 0, y: height2 * pixelRatio,
      //    width: windowWidth * pixelRatio,
      //    height: (windowHeight - height2 * 2) * pixelRatio,
      //    destWidth: 500,
      //    destHeight: 400
      // })
   }
})

// 游戏圈
window.GameClubButton = wx.createGameClubButton({
   icon: 'light',
   style: {
      top: 10,
      left: 10,
      width: 40,
      height: 40
   },
});

// 主域绘制
var loopDrawShareCanvas = () => {
   drawTimes++;
   if (drawTimes > 50) {
      return;
   }
   let openDataContext = wx.getOpenDataContext();
   let sharedCanvas = openDataContext.canvas;

   var rankTexture = new cc.Texture2D();
   rankTexture.initWithElement(sharedCanvas);
   rankTexture.handleLoadedTexture();
   rankSpriteFrame.setTexture(rankTexture);
   rankSprite.setSpriteFrame(rankSpriteFrame);
   //  console.log('draw:', drawTimes);
}
// 画方块
var createColorBg = (size, x, y, color) => {
   var bg = new cc.LayerColor(color);
   bg.setContentSize(size);
   bg.setAnchorPoint(cc.p(0.5, 0.5));
   bg.ignoreAnchorPointForPosition(false);
   bg.attr({ x: x, y: y });
   return bg;
}
var rankSpriteFrame;
var rankSprite;
var rankBg;
var rankHandle;
var drawTimes = 0;
// 开放域，排行榜
window.openRankList = (scene, size, ticket) => {
   var cx = size.width / 2;
   var cy = size.height / 2;
   // 两个按钮
   var btnTextColor = cc.color(255, 254, 254, 255);
   var btnBgColor = cc.color(58, 177, 183, 255);
   var bgColor = cc.color(145, 197, 202, 255);
   // 背景
   scene.setEnable(false);
   rankBg = createColorBg(size, cx, cy, cc.color(0, 0, 0, 150));
   scene.addChild(rankBg, 100);
   var gray = createColorBg(cc.size(440, 570), cx, cy + 150, bgColor);
   rankBg.addChild(gray);
   var gray = createColorBg(cc.size(440, 60), cx, cy - 180, bgColor);
   rankBg.addChild(gray);

   // 标题
   var label = new cc.LabelTTF(
      ticket ? "群排行榜" : "周排行榜",
      'Arial-BoldMT',
      40,
      null,
      cc.TEXT_ALIGNMENT_CENTER
   );
   label.attr({ x: cx, y: size.height - 80 });
   label.setColor(cc.color(255, 254, 194, 255));
   rankBg.addChild(label);
   // 群排行
   var groupBg = createColorBg(cc.size(200, 50), cx + 120, 233, btnBgColor);
   rankBg.addChild(groupBg);
   var groupButton;
   if (!ticket) {
      groupButton = new cc.MenuItemFont("查看群排行", function () {
         wx.shareAppMessage({
            title: '你能排第几？',
            imageUrl: 'res/pic.jpg'
         })
      }, window);
   } else {
      groupButton = new cc.MenuItemFont("我来试一试", function () {
         closeRanklist();
         MainScene.play(true);
      }, window);
   }
   groupButton.setFontSize(30);
   groupButton.setColor(btnTextColor);
   groupButton.attr({ x: cx + 120, y: 230 });

   // 关闭
   var closeBg = createColorBg(cc.size(100, 50), cx - 170, 233, btnBgColor);
   rankBg.addChild(closeBg);
   var closeButton = new cc.MenuItemFont("关闭", function () {
      closeRanklist();
   }, window);
   closeButton.setFontSize(30);
   closeButton.setColor(btnTextColor);
   closeButton.attr({ x: cx - 170, y: 230 });

   var menu = new cc.Menu(closeButton, groupButton);
   menu.attr({ x: 0, y: 0 });
   rankBg.addChild(menu);

   // 显示内容
   rankSprite = cc.Sprite.create();
   rankSprite.attr({ x: cx, y: cy });
   rankBg.addChild(rankSprite);

   // 开放域数据刷新
   let openDataContext = wx.getOpenDataContext();
   let sharedCanvas = openDataContext.canvas;
   sharedCanvas.width = 440;
   sharedCanvas.height = 800;
   rankSpriteFrame = new cc.SpriteFrame();
   rankSpriteFrame.setRect(cc.rect(0, 0, 440, 800));
   drawTimes = 0;
   openDataContext.postMessage({ action: ticket ? 'groupRank' : 'friendRank', key: 'top', ticket: ticket });
   loopDrawShareCanvas();
   rankHandle = setInterval(loopDrawShareCanvas, 100);
}
// 关闭排行榜
var closeRanklist = () => {
   rankSpriteFrame = null;
   rankSprite = null;
   if (rankHandle)
      clearInterval(rankHandle);
   rankBg.removeFromParent(true);
   if (MainScene.instance) {
      MainScene.instance.setEnable(true);
   }
}
// 打开转发
wx.onShow(res => {
   var shareTicket = res.shareTicket;
   if (shareTicket && MainScene.instance) {
      closeRanklist();
      openRankList(MainScene.instance, MainScene.size, shareTicket);
   }
});