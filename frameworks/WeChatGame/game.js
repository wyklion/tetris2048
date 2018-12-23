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
         width: windowWidth,
      }
   })
   bannerAd.show();
   bannerAd.onResize(res => {
      bannerAd.style.left = (windowWidth - bannerAd.style.realWidth) * 0.5;
      bannerAd.style.top = windowHeight - bannerAd.style.realHeight;
      if (bannerAd.style.realHeight > height) {
         bannerAd.style.width = windowWidth * height / bannerAd.style.realHeight;
      }
   })
   bannerAd.onLoad(() => {
      if (lastBanner) {
         lastBanner.destroy();
      }
      lastBanner = bannerAd;
   });
   bannerAd.show();
}
createBanner();
setInterval(() => {
   createBanner();
}, 30000)

// 分享
var height2 = windowHeight * 0.153;
wx.showShareMenu();
wx.onShareAppMessage(function () {
   return {
      title: '俄罗斯方块2048',
      imageUrl: canvas.toTempFilePathSync({
         x: 0, y: height2 * pixelRatio,
         width: windowWidth * pixelRatio,
         height: (windowHeight - height2 * 2) * pixelRatio,
         destWidth: 500,
         destHeight: 400
      })
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
   wxRankBg.setSpriteFrame(rankSpriteFrame);
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
var wxRankBg;
var rankHandle;
var drawTimes = 0;
// 开放域，排行榜
window.openRankList = (scene, size) => {
   var cx = size.width / 2;
   var cy = size.height / 2;
   // 背景
   scene.setEnable(false);
   var bg = createColorBg(size, cx, cy, cc.color(0, 0, 0, 200));
   scene.addChild(bg, 100);
   var gray = createColorBg(cc.size(440, 570), cx, cy + 150, cc.color(80, 80, 80, 255));
   bg.addChild(gray);
   var gray = createColorBg(cc.size(440, 60), cx, cy - 180, cc.color(80, 80, 80, 255));
   bg.addChild(gray);

   // 标题
   var label = new cc.LabelTTF(
      "周排行榜",
      'Arial-BoldMT',
      40,
      null,
      cc.TEXT_ALIGNMENT_CENTER
   );
   label.attr({ x: cx, y: size.height - 80 });
   label.setColor(cc.color(255, 165, 80, 255));
   bg.addChild(label);
   // 群排行
   var groupBg = createColorBg(cc.size(200, 50), cx + 120, 233, cc.color(160, 160, 160, 255));
   bg.addChild(groupBg);
   var groupButton = new cc.MenuItemFont("查看群排行", function () {
      rankSpriteFrame = null;
      wxRankBg = null;
      if (rankHandle)
         clearInterval(rankHandle);
      bg.removeFromParent(true);
      scene.setEnable(true);
   }, window);
   groupButton.setFontSize(30);
   groupButton.setColor(cc.color(10, 10, 10, 255));
   groupButton.attr({ x: cx + 120, y: 233 });

   // 关闭
   var closeBg = createColorBg(cc.size(100, 50), cx - 170, 233, cc.color(160, 160, 160, 255));
   bg.addChild(closeBg);
   var closeButton = new cc.MenuItemFont("关闭", function () {
      rankSpriteFrame = null;
      wxRankBg = null;
      if (rankHandle)
         clearInterval(rankHandle);
      bg.removeFromParent(true);
      scene.setEnable(true);
   }, window);
   closeButton.setFontSize(30);
   closeButton.setColor(cc.color(10, 10, 10, 255));
   closeButton.attr({ x: cx - 170, y: 233 });

   var menu = new cc.Menu(closeButton, groupButton);
   menu.attr({ x: 0, y: 0 });
   bg.addChild(menu);

   // 显示内容
   wxRankBg = cc.Sprite.create();
   wxRankBg.attr({ x: cx, y: cy });
   bg.addChild(wxRankBg);

   // 开放域数据刷新
   let openDataContext = wx.getOpenDataContext();
   let sharedCanvas = openDataContext.canvas;
   sharedCanvas.width = 440;
   sharedCanvas.height = 800;
   rankSpriteFrame = new cc.SpriteFrame();
   rankSpriteFrame.setRect(cc.rect(0, 0, 440, 800));
   drawTimes = 0;
   openDataContext.postMessage({ action: 'friendRank', key: 'top' });
   loopDrawShareCanvas();
   rankHandle = setInterval(loopDrawShareCanvas, 100);
}