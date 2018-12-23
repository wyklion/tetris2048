
var TetrisData;
var GameData = window.GameData = {
   init: function () {
      this.music = parseInt(this.get("music")) || 1;
      this.high = parseInt(this.get("high")) || 0;
      this.relaxHigh = parseInt(this.get("relaxHigh")) || 0;
      this.weekTime = parseInt(this.get("weekTime")) || Date.now();
      this.highWeek = parseInt(this.get("highWeek")) || 0;
      this.relaxHighWeek = parseInt(this.get("relaxHighWeek")) || 0;
      this.rate = parseInt(this.get("rate")) || 0;
      this.playRateTime = parseInt(this.get("playRateTime")) || 6;
      this.adTime = parseInt(this.get("adTime")) || 0;
      TetrisData = this.tetris = JSON.parse(this.get("tetris") || "{}");
   },
   set: function (key, value) {
      this[key] = value;
      cc.sys.localStorage.setItem(key, value);
   },
   get: function (key) {
      return cc.sys.localStorage.getItem(key);
   },
   save: function () {
      var tetrisValue = JSON.stringify(this.tetris);
      cc.sys.localStorage.setItem("tetris", tetrisValue);
   },
   // 取周一5点的时间戳
   getMondayTime: function () {
      var nowDate = new Date();
      var day = nowDate.getDay();
      if (day === 0) day = 7;
      var monday = new Date(nowDate - (day - 1) * 86400000);
      monday.setHours(5, 0, 0, 0);
      return monday.getTime();
   },
   // 得分记录，最高分，最高周分
   handleScore: function (key, score, wxKey) {
      if (score > GameData[key]) {
         GameData.set(key, score);
      }
      var mondayTime = GameData.getMondayTime();
      var weekKey = key + 'Week';
      if (GameData.weekTime < mondayTime || score > GameData[weekKey]) {
         GameData.set(weekKey, score);
         GameData.set('weekTime', Date.now());
         // 微信处理
         if (isWeixinGame) {
            GameData.setWeixinScore(wxKey, score);
         }
      }
   },
   // 微信得分存放
   setWeixinScore: function (key, score) {
      // 游戏中心排行榜
      var value = {
         wxgame: {
            "score": score,
            "update_time": Math.floor(Date.now() / 1000)
         }
      }
      wx.setUserCloudStorage({ KVDataList: [{ key: key, value: JSON.stringify(value) }] });
   }
}