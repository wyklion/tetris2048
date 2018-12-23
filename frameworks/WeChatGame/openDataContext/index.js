
const PAGE_SIZE = 7;
const ITEM_HEIGHT = 60;

class RankListRenderer {
   constructor() {
      this.totalPage = 0;
      this.currPage = 0;
      this.gameDatas = [];
      this.currentData = null;
      this.currentUser = null;
      this.mondayTime = this.getMondayTime() / 1000;
      this.init();
   }

   init() {
      this.canvas = wx.getSharedCanvas();
      this.ctx = this.canvas.getContext('2d');
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = "high";
   }

   // 取周一5点的时间戳
   getMondayTime() {
      var nowDate = new Date();
      var day = nowDate.getDay();
      if (day === 0) day = 7;
      var monday = new Date(nowDate - (day - 1) * 86400000);
      monday.setHours(5, 0, 0, 0);
      return monday.getTime();
   }

   listen() {
      wx.getUserInfo({
         openIdList: ['selfOpenId'],
         success: res => {
            if (res.data && res.data.length) {
               this.currentUser = res.data[0];
            }
         }
      })
      wx.onMessage(msg => {
         if (msg.action === 'friendRank') {
            if (!msg.key)
               return;
            this.fetchFriendData(msg.key);
         } else if (msg.action === 'groupRank') {
            if (!msg.ticket || !msg.key)
               return;
            this.fetchGroupData(msg.ticket, msg.key);
         } else if (msg.action === 'page') {
            if (!this.gameDatas.length)
               return;
            const delta = msg.data;
            const newPage = this.currPage + delta;
            if (newPage < 0 || newPage + 1 > this.totalPage)
               return;
            this.currPage = newPage;
            this.showPagedRanks(newPage);
         }
      });
   }

   getRankValues(data, key) {
      var rankList = [];
      data.forEach((item, index) => {
         var score = 0;
         item.KVDataList.forEach(d => {
            var jvalue = JSON.parse(d.value);
            var value = jvalue.wxgame.score;
            var updateTime = jvalue.wxgame.update_time;
            if (d.key === key && updateTime > this.mondayTime && value) {
               score = value;
            }
         })
         if (score > 0) {
            var record = {
               name: item.nickname,
               icon: item.avatarUrl,
               score: score
            }
            rankList.push(record);
            if (this.currentUser && this.currentUser.nickName === record.name) {
               this.currentData = record;
            }
         }
      })
      rankList.sort((a, b) => b.score - a.score);
      rankList.forEach((a, b) => a.rank = b + 1);
      console.log(rankList);
      return rankList;
   }

   fetchGroupData(shareTicket, key) {
      //取出群同玩成员数据
      wx.getGroupCloudStorage({
         shareTicket,
         keyList: [
            key,
         ],
         success: res => {
            this.showRank(res.data, key);
         },
         fail: res => {
            console.log("wx.getGroupCloudStorage fail", res);
         },
      });
   }

   fetchFriendData(key) {
      //取出所有好友数据
      wx.getFriendCloudStorage({
         keyList: [key],
         success: res => {
            this.showRank(res.data, key);
         },
         fail: res => {
            // console.log("wx.getFriendCloudStorage fail", res);
         },
      });
   }

   showRank(data, key) {
      // console.log("rank info:", data);
      this.currentData = null;
      var rankList = this.gameDatas = this.getRankValues(data, key);
      const dataLen = rankList.length;
      this.currPage = 0;
      this.totalPage = Math.ceil(dataLen / PAGE_SIZE);
      if (dataLen) {
         this.showPagedRanks(0);
      }
   }

   showPagedRanks(page) {
      const pageStart = page * PAGE_SIZE;
      const pagedData = this.gameDatas.slice(pageStart, pageStart + PAGE_SIZE);
      this.ctx.clearRect(0, 0, 440, 800);
      for (let i = 0, len = pagedData.length; i < len; i++) {
         this.drawRankItem(this.ctx, i, pagedData[i]);
      }
      if (this.currentData) {
         this.drawRankItem(this.ctx, 8.45, this.currentData);
      }
   }

   //canvas原点在左上角
   drawRankItem(ctx, index, data) {
      const rank = data.rank;
      const avatarUrl = data.icon.substr(0, data.icon.length - 3) + "46";
      const nick = data.name.length <= 10 ? data.name : data.name.substr(0, 10) + "...";
      const grade = data.score;
      const itemGapY = ITEM_HEIGHT * index;
      //名次
      var color = 'white';
      if (index === 0)
         color = '#F88D61';
      else if (index === 1)
         color = '#E8AD41';
      else if (index === 2)
         color = '#E8ED81';
      ctx.fillStyle = color;
      ctx.textAlign = "right";
      ctx.baseLine = "middle";
      ctx.font = "34px Helvetica";
      ctx.fillText(`${rank}`, 45, 85 + itemGapY);

      //头像
      const avatarImg = wx.createImage();
      avatarImg.src = avatarUrl;
      avatarImg.onload = () => {
         ctx.drawImage(avatarImg, 70, 50 + itemGapY, 46, 46);
      };

      //名字
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "left";
      ctx.baseLine = "middle";
      ctx.font = "24px Helvetica";
      ctx.fillText(nick, 130, 80 + itemGapY);

      //分数
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "right";
      ctx.baseLine = "middle";
      ctx.font = "24px Helvetica";
      ctx.fillText(`${grade}`, 415, 80 + itemGapY);
   }
}

const rankList = new RankListRenderer();
rankList.listen();
