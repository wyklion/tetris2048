require('libs/weapp-adapter-min');

// 这里需要先加载微信脚本，不然 window 对象会报错
window.REMOTE_SERVER_ROOT = '';//远程服务器地址

var Parser = require('libs/xmldom/dom-parser');
window.DOMParser = Parser.DOMParser;
require('weapp-adapter');
require('game.min');

// 广告条
var { windowWidth, windowHeight, pixelRatio } = wx.getSystemInfoSync();
var height = windowHeight * 0.102;
let bannerAd = wx.createBannerAd({
   adUnitId: 'adunit-c0ee23e59d3ce0ae',
   style: {
      left: 0,
      top: windowHeight - height,
      // width: windowWidth,
      height: height,
   }
})
bannerAd.show();
bannerAd.onResize(res => {
   bannerAd.style.left = (windowWidth - bannerAd.style.realWidth) * 0.5;
})

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