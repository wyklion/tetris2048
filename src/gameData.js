
var TetrisData;
var GameData = {
   init: function () {
      this.music = parseInt(this.get("music")) || 1;
      this.high = parseInt(this.get("high")) || 0;
      this.relaxHigh = parseInt(this.get("relaxHigh")) || 0;
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
   }
}