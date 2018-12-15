var TetrisLayer = cc.Layer.extend({
   ctor: function () {
      this._super();
      this.init();
   },
   init: function () {
      this.setContentSize(cc.size(BASESIZE * COL, BASESIZE * ROW));
      var bg = new cc.LayerColor(colors.bg);
      bg.setContentSize(cc.size(BASESIZE * COL, BASESIZE * ROW));
      this.addChild(bg);
   },
   generateTestBlock: function () {
      for (var k in testCase) {
         var v = testCase[k];
         var idx = parseInt(k) - 1;
         this.block[idx].num = v;
         this.block[idx].pic = this.getNumerSprite(v, idx);
      }
   },
   getNumerSprite: function (num, idx) {
      var pic = new cc.LayerColor(colors[num]);
      pic.setContentSize(cc.size(BASESIZE, BASESIZE));
      pic.setAnchorPoint(cc.p(0.5, 0.5));
      pic.ignoreAnchorPointForPosition(false);
      // var pic = new cc.DrawNode();
      // pic.drawRect(cc.p(-BASESIZE / 2, -BASESIZE / 2), cc.p(BASESIZE / 2, BASESIZE / 2), colors[num], 0);
      // pic.setAnchorPoint(cc.p(0.5, 0.5));
      var text = "" + num;
      var size = 60;
      var len = text.length;
      switch (len) {
         case 1:
            size = 60;
            break;
         case 2:
            size = 55;
            break;
         case 3:
            size = 50;
            break;

         case 4:
            size = 40;
            break;

         case 5:
            size = 32;
            break;

         case 6:
            size = 27;
            break;

         case 7:
            size = 23;
            break;
         default:
            size = 20;
      }
      var color = colors.num124;
      if (num >= 8)
         color = colors.num816;
      var label = new cc.LabelTTF(
         text,
         "Arial",
         size,
         null,
         cc.TEXT_ALIGNMENT_CENTER
      );
      label.attr({ x: BASESIZE * 0.5, y: BASESIZE * 0.5 });
      label.setFontFillColor(color);
      pic.addChild(label);
      if (idx != null) {
         pic.setPosition(this.getBlockPosition(idx));
         pic.idx = idx;
         this.addChild(pic);
      }
      return pic;
   },
   getBlockPosition: function (idx) {
      var pos = this.pos(idx);
      var px = BASESIZE * (pos.x - 0.5);
      var py = BASESIZE * (pos.y - 0.5);
      return cc.p(px, py);
   },

   setNowNumPos: function (x, y) {
      //this.nowPic.x = x;
      //this.nowPic.y = y;
      var idx = this.idx(x, y);
      this.nowPic.idx = idx;
      this.nowPic.setPosition(this.getBlockPosition(idx));
   },

   getRandomNum: function () {
      return RANDNUM[Math.floor(Math.random() * RANDNUM.length)];
   },

   getNextNumer: function (num) {
      this.nextNum = num || this.getRandomNum();
      if (TestMode) {
         this.nextNum = TestNext;
      }
      this.scene.setNext(this.nextNum);
   },
   // 掉下一个数
   sendNumer: function (nowNum, nextNum, first) {
      //    --[[
      //    gameState = "READY"
      //    var x,y = this.getParent().nextPic.getPosition()
      //    var scale = this.getParent().nextPic.getScale()
      //    this.getParent().nextPic.setVisible(false)
      //   this.nowNum = this.nextNum
      //   this.nowPic = this.getNumerSprite(this.nowNum)
      //    this.nowPic.setPosition(ccp(x,y))
      //    this.nowPic.setScale(scale)
      //    this.addChild(this.nowPic)
      //    this.nowPic.runAction(transition.sequence({
      //        CCSpawn.createWithTwoActions(CCMoveTo.create(0.1,this.getBlockPosition(this.idx(Math.ceil(COL/2),ROW))),
      //                                                       CCScaleTo.create(0.1,1)),
      //       CCCallFunc.create(function()
      //            gameState = "RUN"
      //            this.getNextNumer()
      //            this.nowPic.idx = this.idx(Math.ceil(COL/2),ROW)
      //            this.passTime = 0
      //        end)
      //    }))
      //    --]]
      this.nowNum = nowNum || this.nextNum;
      this.nowPic = this.getNumerSprite(this.nowNum, this.idx(Math.ceil(COL / 2), ROW));
      this.getNextNumer(nextNum);
      this.passTime = 0;
      if (!first) {
         this.saveRecord();
      }
   },
   /**
    * 从左下数y行x列的序号
    */
   idx: function (x, y) {
      return (y - 1) * COL + x - 1;//数组序号
   },
   pos: function (idx) {
      var y = Math.ceil((idx + 1) / COL);
      var x = idx + 1 - (y - 1) * COL;
      return { x: x, y: y };
   },

   loadRecord: function () {
      if (this.scene.autoDown) {
         if (!TetrisData.playRecord)
            return false;
         for (var i = 0; i < ROW * COL; i++) {
            this.block[i].num = TetrisData.playBrick[i]
            if (this.block[i].num != 0) {
               this.block[i].pic = this.getNumerSprite(this.block[i].num, i)
            }
         }
         this.nowNum = TetrisData.playNowNum;
         this.nextNum = TetrisData.playNextNum;
         this.score = TetrisData.playScore;
         this.level = TetrisData.playLevel;
         this.speed = TetrisData.playSpeed;
         this.levelNum = TetrisData.playLevelNum;
      }
      else {
         if (!TetrisData.relaxRecord)
            return false;
         for (var i = 0; i < ROW * COL; i++) {
            this.block[i].num = TetrisData.relaxBrick[i];
            if (this.block[i].num != 0)
               this.block[i].pic = this.getNumerSprite(this.block[i].num, i);
         }
         this.nowNum = TetrisData.relaxNowNum;
         this.nextNum = TetrisData.relaxNextNum;
         this.score = TetrisData.relaxScore;
         this.level = TetrisData.relaxLevel;
         this.speed = TetrisData.relaxSpeed;
         this.levelNum = TetrisData.relaxLevelNum;
      }
      this.scene.scoreLabel.setString("" + this.score);
      this.sendNumer(this.nowNum, this.nextNum);
      return true;
   },

   saveRecord: function () {
      if (this.scene.autoDown) {
         TetrisData.playBrick = {};
         for (var i = 0; i < ROW * COL; i++) {
            TetrisData.playBrick[i] = this.block[i].num;
         }
         TetrisData.playNowNum = this.nowNum;
         TetrisData.playNextNum = this.nextNum;
         TetrisData.playScore = this.score;
         TetrisData.playLevel = this.level;
         TetrisData.playSpeed = this.speed;
         TetrisData.playLevelNum = this.levelNum;
         TetrisData.playRecord = true;
      }
      else {
         TetrisData.relaxBrick = {};
         for (var i = 0; i < ROW * COL; i++) {
            TetrisData.relaxBrick[i] = this.block[i].num;
         }
         TetrisData.relaxNowNum = this.nowNum;
         TetrisData.relaxNextNum = this.nextNum;
         TetrisData.relaxScore = this.score;
         TetrisData.relaxLevel = this.level;
         TetrisData.relaxSpeed = this.speed;
         TetrisData.relaxLevelNum = this.levelNum;
         TetrisData.relaxRecord = true;
      }
      GameData.save();
   },

   clearRecord: function () {
      if (this.scene.autoDown)
         TetrisData.playRecord = false;
      else
         TetrisData.relaxRecord = false;
      GameData.save();
   },

   start: function () {
      var block = this.block;
      if (block != null) {
         for (var i = 0; i < ROW * COL; i++) {
            this.block[i].num = 0
            if (block[i].pic != null) {
               block[i].pic.removeFromParent(true);
               block[i].pic = null;
            }
         }
      }
      else {
         block = this.block = {};
         for (var i = 0; i < ROW * COL; i++) {
            block[i] = { num: 0, pic: null };
         }
      }

      if (TestMode) {
         this.generateTestBlock();
      }

      this.score = 0;
      this.level = 1;
      this.speed = 1;
      this.levelNum = 64;
      this.scene.scoreLabel.setString("0");
      this.nowNum = 0;
      if (this.nowPic != null) {
         this.nowPic.removeFromParent(true);
      }

      if (!TestMode)
         this.isLoad = this.loadRecord();
      if (!this.isLoad)
         this.sendNumer(null, null, true);
      gameState = "RUN";
      this.passTime = 0;
   },
   addScore: function (subIdx, mergeNum) {
      this.score = this.score + mergeNum;
      var str = "" + this.score;
      this.scene.scoreLabel.setString(str);
      var pt = this.getBlockPosition(subIdx);
      var px = cx - COL * BASESIZE * 0.5;
      var py = cy - ROW * BASESIZE * 0.5;
      var score = new cc.LabelTTF(
         "+" + mergeNum,
         "Arial",
         30,
         null,
         cc.TEXT_ALIGNMENT_CENTER
      );
      score.attr({ x: px + pt.x, y: py + pt.y, color: cc.color(128, 128, 128) });
      this.scene.addChild(score);
      var action = cc.sequence(
         cc.spawn(cc.moveBy(0.5, cc.p(0, BASESIZE * 0.5)), cc.fadeOut(0.5)),
         cc.callFunc(function () {
            score.removeFromParent(true);
         })
      );
      score.runAction(action);
   },
   move: function (orient) {
      // console.log("move", orient);
      var pos = this.pos(this.nowPic.idx);
      var x = pos.x;
      var y = pos.y;
      if (orient == "left") {
         if (x != 1 && this.block[this.nowPic.idx - 1].num == 0)
            x = x - 1;
         else
            return;
      }
      else if (orient == "right") {
         if (x != COL && this.block[this.nowPic.idx + 1].num == 0)
            x = x + 1;
         else
            return;
      }
      // --if GameData.music then audio.playEffect(res.smove) end
      this.setNowNumPos(x, y);
   },
   dropOneRow: function () {
      var pos = this.pos(this.nowPic.idx);
      var x = pos.x;
      var y = pos.y;
      if (y > 1 && this.block[this.nowPic.idx - COL].num == 0) {
         this.setNowNumPos(x, y - 1);
         return
      }

      if (y == ROW && x == Math.ceil(COL / 2)) {
         if (this.block[this.nowPic.idx - COL].num != this.nowNum) {
            this.scene.gameOver();
            return;
         }
      }
      gameState = "DROP";
      var idx = this.nowPic.idx;
      this.block[idx].num = this.nowNum;
      this.block[idx].pic = this.nowPic;
      this.checkMerge([this.nowPic.idx]);
   },
   drop: function () {
      // console.log("drop");
      gameState = "DROP";
      var block = this.block;
      var stopY = ROW;
      var pos = this.pos(this.nowPic.idx);
      var x = pos.x;
      var y = pos.y;
      for (var row = ROW; row >= 1; row--) {
         var idx = this.idx(x, row);
         if (this.block[idx].num != 0) {
            stopY = row + 1;
            break;
         }
         if (row == 1) {
            stopY = 1;
         }
      }
      if (stopY == ROW && x == Math.ceil(COL / 2)) {
         if (block[this.nowPic.idx - COL].num != this.nowNum) {
            this.scene.gameOver();
            return;
         }
      }

      if (1) {
         this.setNowNumPos(x, stopY);
         var idx = this.idx(x, stopY);
         block[idx].num = this.nowNum;
         block[idx].pic = this.nowPic;
         this.checkMerge([idx]);
      } else {
         var idx = this.idx(x, stopY);
         var _this = this;
         var action = cc.sequence(
            cc.moveTo((y - stopY) * BASESIZE / DROPSPEED, this.getBlockPosition(idx)),
            cc.callFunc(function () {
               _this.nowPic.idx = idx;
               _this.nowPic.setPosition(_this.getBlockPosition(idx));
               _this.block[idx].num = _this.nowNum;
               _this.block[idx].pic = _this.nowPic;
               _this.checkMerge([idx]);
            })
         );
         this.nowPic.runAction(action);
      }
   },
   light: function (idx) {
      var pos = this.getBlockPosition(idx);
      var light = new cc.LayerColor(cc.color(255, 255, 255, 0));
      this.addChild(light);
      light.setContentSize(CCSize(BASESIZE, BASESIZE))
      light.setPosition(pos)
      light.setAnchorPoint(ccp(0.5, 0.5))
      light.ignoreAnchorPointForPosition(false)
      light.runAction(cc.sequence(
         cc.adeTo(0.1, 128),
         cc.fadeTo(0.1, 0),
         cc.callFunc(function () {
            light.removeFromParent(true);
         })
      ));
   },
   getNearbySameNumbers: function (mergeIdx, idx) {
      //console.log("getNear.."..idx);
      var mergeDatas = this.mergeNumers[mergeIdx];
      for (var k in mergeDatas) {
         if (mergeDatas[k] == idx) {
            //console.log("has.."..idx)
            return;
         }
      }
      mergeDatas.push(idx);
      var pos = this.pos(idx);
      var x = pos.x;
      var y = pos.y;
      var block = this.block;
      var num = block[idx].num;
      if (x > 1) { //left
         if (block[this.idx(x - 1, y)].num == num) {
            //console.log("same left..")
            this.getNearbySameNumbers(mergeIdx, this.idx(x - 1, y));
         }
      }
      if (x < COL) {  //right
         if (block[this.idx(x + 1, y)].num == num) {
            //console.log("same right..")
            this.getNearbySameNumbers(mergeIdx, this.idx(x + 1, y));
         }
      }
      if (y < ROW) {  //up
         if (block[this.idx(x, y + 1)].num == num) {
            //console.log("same up..")
            this.getNearbySameNumbers(mergeIdx, this.idx(x, y + 1));
         }
      }
      if (y > 1) {  //down
         if (block[this.idx(x, y - 1)].num == num) {
            //console.log("same down..")
            this.getNearbySameNumbers(mergeIdx, this.idx(x, y - 1));
         }
      }
   },
   checkMerge: function (idxes, noDown) {
      //console.log(idxes);
      var mergeNumers = this.mergeNumers = {};
      this.mergeCount = {}
      var needMerge = this.needMerge = []; //需要合成的点
      for (var i = 0; i < idxes.length; i++) {
         var idx = idxes[i];
         if (this.block[idx].num != 0) {
            mergeNumers[idx] = []; //检查点上的相邻相同数
            this.getNearbySameNumbers(idx, idx);
            //console.log(this.mergeNumers[idx]);
            if (mergeNumers[idx].length >= 2) {
               needMerge.push(idx);
            }
         }
      }

      //不需要合并就结束。唯一终结点。
      var needMergeCount = needMerge.length;
      if (needMergeCount == 0) {
         gameState = "RUN";
         if (!noDown) {
            if (GameData.music) audio.playEffect(res.sdown);

         }
         this.sendNumer();
         return false;
      }
      this.checkCount = needMergeCount;
      if (PrintTest) {
         console.log(needMerge);
      }
      var _this = this;
      for (var i = 0; i < needMergeCount; i++) {
         this.merge(needMerge[i], function () {
            _this.checkCount = _this.checkCount - 1;
            if (PrintTest) {
               console.log("AllMerge count.." + (_this.checkCount + 1) + "->" + _this.checkCount);
            }
            if (_this.checkCount == 0) {
               _this.sortAfterMerge();
            }
         })
      }
   },
   merge: function (idx, callback) {
      if (this.block[idx].num == 0) {
         //应该是被别的合并了。
         if (PrintTest) {
            console.log("被合并了跳过:", idx);
         }
         callback();
         return;
      }
      var mergeNumers = this.mergeNumers;
      var mergeDatas = mergeNumers[idx];
      var mergeCount = this.mergeCount;
      var block = this.block;

      if (PrintTest) {
         var str = "MergeIdx:";
         for (var i = 0; i < mergeDatas.length; i++) {
            str = str + mergeDatas[i] + ",";
         }
         console.log(str);
      }

      mergeCount[idx] = mergeDatas.length;
      if (mergeCount[idx] == 2) {
         if (GameData.music) {
            audio.playEffect(res.smerge1);
         }
      }
      else if (mergeCount[idx] == 3) {
         if (GameData.music) {
            audio.playEffect(res.smerge2);
         }
      }
      else {
         if (GameData.music) {
            audio.playEffect(res.smerge3);
         }
      }
      var _this = this;
      var mergeNum = block[idx].num * Math.pow(2, mergeDatas.length - 1);
      var num = this.nowNum;
      for (var i = 0; i < mergeDatas.length; i++) {
         var subIdx = mergeDatas[i];
         var action = null;
         if (subIdx != idx) { //被合成块闪一下就消失。
            block[subIdx].num = 0;
            (function (subIdx) {
               action = cc.sequence(
                  cc.fadeTo(0.1, 128),
                  cc.fadeTo(0.1, 255),
                  cc.callFunc(function () {
                     block[subIdx].pic.removeFromParent(true);
                     block[subIdx] = { num: 0, pic: null };
                     mergeCount[idx] = mergeCount[idx] - 1;
                     if (PrintTest) {
                        console.log("mergeIdx:" + idx + " count.." + (mergeCount[idx] + 1) + "->" + mergeCount[idx]);
                     }
                     if (mergeCount[idx] == 0) {
                        callback();
                     }
                  })
               );
            })(subIdx);
         }
         else { //合成块闪一下，再变成新块再放大一下。
            (function (subIdx) {
               action = cc.sequence(
                  cc.fadeTo(0.1, 128),
                  cc.fadeTo(0.1, 255),
                  cc.callFunc(function () {
                     block[subIdx].pic.removeFromParent(true);
                     block[subIdx].num = mergeNum;
                     block[subIdx].pic = _this.getNumerSprite(mergeNum, subIdx);
                     block[subIdx].pic.runAction(cc.sequence(
                        cc.callFunc(function () {
                           //加分
                           _this.addScore(subIdx, mergeNum)
                           //判断等级
                           while (mergeNum > _this.levelNum) {
                              _this.level = _this.level + 1;
                              _this.speed = _this.speed * 0.85;
                              _this.levelNum = _this.levelNum * 2;
                              //_this.scene.levelLabel.setString("Lv "+_this.level);
                           }
                        }),
                        cc.scaleTo(0.1, 1.1),
                        cc.scaleTo(0.1, 1),
                        cc.callFunc(function () {
                           //block[subIdx].pic.removeFromParentAndCleanup(true)
                           //block[subIdx].num = mergeNum
                           //block[subIdx].pic = this.getNumerSprite(mergeNum,subIdx)
                           mergeCount[idx] = mergeCount[idx] - 1;
                           if (PrintTest) {
                              console.log("mergeIdx:" + idx + " count.." + (mergeCount[idx] + 1) + "->" + mergeCount[idx]);
                           }
                           if (mergeCount[idx] == 0) {
                              callback();
                           }
                        })
                     ));
                  })
               );
            })(subIdx);
         }
         block[subIdx].pic.runAction(action);
      }
   },

   sortAfterMerge: function () {
      var block = this.block;
      var needMerge = this.needMerge;

      //console.log("sortAfterMerge");
      var downNumbers = this.downNumbers = [];
      for (var col = 1; col <= COL; col++) {
         var blank = false;
         for (var row = 1; row <= ROW; row++) {
            var idx = this.idx(col, row);
            if (block[idx].num == 0) {
               blank = true;
            }
            else if (blank && block[idx] != 0) {
               downNumbers.push(idx);
            }
         }
      }
      //合成点有可能不需要掉落，也得再次检查合成
      var addCheckNumbers = [];
      for (var i = 0; i < needMerge.length; i++) {
         var has = false;
         for (var k in downNumbers) {
            if (downNumbers[k] == needMerge[i]) {
               has = true;
               break;
            }
         }
         if (!has) {
            addCheckNumbers.push(needMerge[i]);
         }
      }

      //没有掉落，但还得检查之前的合成点
      var downNumbersCount = downNumbers.length;
      if (downNumbersCount == 0) {
         this.checkMerge(addCheckNumbers, true)
         return
      }
      this.downCount = downNumbersCount;
      var _this = this;
      for (var i = 0; i < downNumbersCount; i++) {
         var idx = downNumbers[i];
         var downIdx = idx - COL;
         //有可能往下掉好几格
         while (downIdx - COL > 0) {
            if (block[downIdx - COL].num == 0)
               downIdx = downIdx - COL;
            else
               break;
         }
         block[downIdx].num = block[idx].num;
         block[downIdx].pic = block[idx].pic;
         downNumbers[i] = downIdx
         block[idx] = { num: 0, pic: null };
         var action = cc.sequence(
            cc.moveBy(0.1, cc.p(0, -BASESIZE * (idx - downIdx) / COL)).easing(cc.easeIn(3)),
            cc.callFunc(function () {
               _this.downCount = _this.downCount - 1;
               if (_this.downCount == 0) {
                  for (var j = 0; j < addCheckNumbers.length; j++) {
                     //严重bug，重复了。gxj提出来的。
                     var downHas = false;
                     for (var k = 0; k < downNumbers.length; k++) {
                        if (downNumbers[k] == addCheckNumbers[j]) {
                           downHas = true;
                           break;
                        }
                     }
                     if (!downHas) {
                        downNumbers.push(addCheckNumbers[j]);
                     }
                  }
                  _this.checkMerge(downNumbers);
               }
            })
         );
         block[downIdx].pic.runAction(action);
      }
      //console.log(downNumbers);
   }
})
