
const PAGE_SIZE = 10;
const ITEM_HEIGHT = 60;

class RankListRenderer {
   constructor() {
      this.totalPage = 0;
      this.currPage = 0;
      this.gameDatas = [];
      this.init();
   }

   init() {
      this.canvas = wx.getSharedCanvas();
      this.ctx = this.canvas.getContext('2d');
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = "high";
   }

   listen() {
      //msg -> {action, data}
      wx.onMessage(msg => {
         if (msg.action === 'friendRank') {
            if (!msg.key)
               return;
            this.fetchFriendData(msg.key);
         } else if (msg.action === 'groupRank') {
            if (!msg.data || !msg.key)
               return;
            this.fetchGroupData(msg.data, msg.key);
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
            if (d.key === key && value) {
               score = value;
            }
         })
         if (score > 0) {
            rankList.push({
               name: item.nickname,
               icon: item.avatarUrl,
               score: score
            })
         }
      })
      rankList.sort((a, b) => b.score - a.score);
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
            console.log("wx.getGroupCloudStorage success", res);
            const dataLen = res.data.length;
            this.gameDatas = dataSorter(res.data);
            this.currPage = 0;
            this.totalPage = Math.ceil(dataLen / PAGE_SIZE);
            if (dataLen) {
               this.showPagedRanks(0);
            }
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
            console.log("wx.getFriendCloudStorage success", res);
            var rankList = this.gameDatas = this.getRankValues(res.data, key);
            const dataLen = rankList.length;
            this.currPage = 0;
            this.totalPage = Math.ceil(dataLen / PAGE_SIZE);
            if (dataLen) {
               this.showPagedRanks(0);
            }
         },
         fail: res => {
            console.log("wx.getFriendCloudStorage fail", res);
         },
      });
   }

   showPagedRanks(page) {
      const pageStart = page * PAGE_SIZE;
      const pagedData = this.gameDatas.slice(pageStart, pageStart + PAGE_SIZE);
      const pageLen = pagedData.length;
      this.ctx.clearRect(0, 0, 440, 800);
      for (let i = 0, len = pagedData.length; i < len; i++) {
         this.drawRankItem(this.ctx, i, pageStart + i + 1, pagedData[i], pageLen);
      }
   }

   //canvas原点在左上角
   drawRankItem(ctx, index, rank, data, pageLen) {
      const avatarUrl = data.icon.substr(0, data.icon.length - 1) + "132";
      const nick = data.name.length <= 10 ? data.name : data.name.substr(0, 10) + "...";
      const grade = data.score;
      const itemGapY = ITEM_HEIGHT * index;
      //名次
      ctx.fillStyle = "#D8AD51";
      ctx.textAlign = "right";
      ctx.baseLine = "middle";
      ctx.font = "40px Helvetica";
      ctx.fillText(`${rank}`, 50, 80 + itemGapY);

      //头像
      const avatarImg = wx.createImage();
      avatarImg.src = avatarUrl;
      avatarImg.onload = () => {
         if (index + 1 > pageLen) {
            return;
         }
         ctx.drawImage(avatarImg, 120, 10 + itemGapY, 100, 100);
      };

      //名字
      ctx.fillStyle = "#EEEEEE";
      ctx.textAlign = "left";
      ctx.baseLine = "middle";
      ctx.font = "24px Helvetica";
      ctx.fillText(nick, 130, 80 + itemGapY);

      //分数
      ctx.fillStyle = "#EEEEEE";
      ctx.textAlign = "left";
      ctx.baseLine = "middle";
      ctx.font = "24px Helvetica";
      ctx.fillText(`${grade}分`, 310, 80 + itemGapY);

      // //分隔线
      // const lineImg = wx.createImage();
      // lineImg.src = 'subdomain/images/llk_x.png';
      // lineImg.onload = () => {
      //    if (index + 1 > pageLen) {
      //       return;
      //    }
      //    ctx.drawImage(lineImg, 14, 120 + itemGapY, 720, 1);
      // };
   }
}

const rankList = new RankListRenderer();
rankList.listen();