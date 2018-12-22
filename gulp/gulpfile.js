var gulp = require("gulp");
var uglify = require('gulp-uglify');//混淆js
var concat = require("gulp-concat");
var rename = require("gulp-rename");
var clean = require('gulp-clean')
var replace = require("gulp-replace");
var htmlmin = require('gulp-htmlmin');
var optimisejs = require('gulp-optimize-js');
var through = require('through2');
var argv = require('yargs').argv;
var merge2 = require("merge2");
var pako = require('pako');

var fs = require('fs');
var path = require('path');

// var runSequence = require('run-sequence');
// var srcToVariable = require("gulp-content-to-variable");
// var addModuleExports = require("./gulp-addModuleExports");
// var uncommentShader = require("./gulp-removeShaderComments");

// var gutil = require('gulp-util');
// var PluginError = gutil.PluginError;
// var File = gutil.File;

// var buildModule = ["drogon"];
// var bootFile = "bootFile";
// var extendsSearchRegex = /var\s__extends[\s\S]+?\};/g;
// var decorateSearchRegex = /var\s__decorate[\s\S]+?\};/g;

function CurentTime() {
   var now = new Date();
   var year = now.getFullYear();       //年
   var month = now.getMonth() + 1;     //月
   if (month < 10) month = "0" + month;
   var day = now.getDate();            //日
   if (day < 10) day = "0" + day;
   var hh = now.getHours();            //时
   if (hh < 10) hh = "0" + hh;
   var mm = now.getMinutes();          //分
   if (mm < 10) mm = "0" + mm;
   var ss = now.getSeconds();            //秒
   if (ss < 10) ss = "0" + ss;

   return "" + year + month + day + hh + mm + ss;
}

var jsAddedCache = {};
function getFileListOfModule(moduleMap, moduleName, ext, dir) {
   if (jsAddedCache[moduleName]) return null;
   dir = dir || "";
   var jsList = [];
   var tempList = moduleMap[moduleName];
   if (!tempList) throw "can not find module [" + moduleName + "]";
   for (var i = 0, li = tempList.length; i < li; i++) {
      var item = tempList[i];
      if (jsAddedCache[item]) continue;
      var extname = path.extname(item);
      if (!extname) {
         var arr = getFileListOfModule(moduleMap, item, ext, dir);
         if (arr) jsList = jsList.concat(arr);
      }
      else if (extname.toLowerCase() === ext) {
         //console.log(path.join(dir, item));
         jsList.push(path.join(dir, item));
      }
      jsAddedCache[item] = 1;
   }
   return jsList;
}

// some build option
var project_dir = path.resolve("../");
var project_json = require(path.join(project_dir, "project.json"));
var publish_dir = path.join(project_dir, "publish/" + path.basename(project_dir));
var publish_res = path.join(publish_dir, "res");
var frame_dir = path.join(project_dir, "frameworks/cocos2d-html5");
var module_config = require(path.join(frame_dir, "moduleConfig.json"));
var res_dir;
var USE_LOADER = argv.p ? true : false;
var gameMinJsName = "game.min." + CurentTime() + ".js";
if (USE_LOADER)
   gameMinJsName += "zip";

// 打包微信小游戏
if (argv.w) {
   frame_dir = path.join(project_dir, "frameworks/cocos2d-html5-weixin");
   module_config = require(path.join(frame_dir, "moduleConfig.json"));
   gameMinJsName = "game.min.js";
}

// console.log("project_dir:", project_dir);
// console.log("frame_dir:", frame_dir);
// console.log("publish_dir:", publish_dir);

//compress code
var compressCode = function () {
   function compress(file, encoding, cb) {
      if (!USE_LOADER) {
         return cb(null, file);
      }
      else {
         var content = String(file.contents);
         content = pako.deflate(content, { to: "string" });
      }
      file.contents = new Buffer(content);
      this.push(file);
      cb(null, file);
   }
   return through.obj(compress);
};

// Compile project...
var projectModify = function () {
   function bufferContents(file, encoding, cb) {
      delete project_json["engineDir"];
      delete project_json["modules"];
      delete project_json["jsList"];
      // 微信平台
      if (argv.w) {
         project_json["platform"] = 'weixin';
      }
      var content = JSON.stringify(project_json);
      file.contents = new Buffer(content);
      this.push(file);
      cb(null, file);
   }
   return through.obj(bufferContents);
};
var htmlModify = function () {
   function bufferContents(file, encoding, cb) {
      // ignore empty files
      if (file.isNull()) {
         cb(null, file);
         return;
      }
      // no stream support, only files.
      if (file.isStream()) {
         this.emit('error', new PluginError('gulp-concat', 'Streaming not supported'));
         cb(null, file);
         return;
      }
      var content = String(file.contents);
      var bootRegex = /(<script\s+src\s*=\s*("|\')[^"\']*Boot\.js("|\')\s*><\/script>)/;
      var insertStr = "";
      var changeRes = res_dir && res_dir !== "res";
      if (changeRes) {
         insertStr = "var RES=\"" + res_dir + "\/\";";
      }
      if (USE_LOADER) {
         var dl = {
            code: [],
         }
         // dl.code.push("res/drogon.js");
         dl.code.push(gameMinJsName.substring(0, gameMinJsName.length - 3));
         insertStr += "var JS_LOAD=" + JSON.stringify(dl) + ";";
      }
      if (insertStr)
         content = content.replace(bootRegex, "<script>" + insertStr + "</script>\n\t$1");
      else
         content = content.replace(bootRegex, "");
      if (USE_LOADER)
         content = content.replace(bootRegex, "");
      var mainJs = project_json["main"] ? project_json["main"] : "main.js";
      content = content.replace("script cocos", "script");
      content = content.replace(mainJs, USE_LOADER ? "res/JsLoader.js" : gameMinJsName);
      if (changeRes) { //资源目录替换
         content = content.replace(/([\"|\(])res\//g, "$1" + res_dir + "\/"); //replace res dir
      }
      file.contents = new Buffer(content);
      this.push(file);
      cb(null, file);
   }
   return through.obj(bufferContents);
}

gulp.task("project_clean", function () {
   return gulp.src(publish_dir + "/*", { read: false })
      .pipe(clean({ force: true }));
});
gulp.task("project_html", ["project_clean"], function () {
   gulp.src(path.join(project_dir, "project.json"), { read: false })
      .pipe(projectModify())
      .pipe(gulp.dest(path.join(publish_dir)));
   // 微信小游戏不用index.html
   if (!argv.w) {
      gulp.src(path.join(project_dir, "index.html"))
         .pipe(htmlModify())
         .pipe(htmlmin({ collapseWhitespace: true, removeComments: true, minifyJS: true }))
         .pipe(gulp.dest(path.join(publish_dir)));
   }
   if (USE_LOADER)
      gulp.src(path.join("./", "JsLoader.js"))
         .pipe(uglify())
         .pipe(optimisejs())
         .pipe(gulp.dest(path.join(publish_res)));
   // 微信小游戏框架复制
   if (argv.w) {
      gulp.src(path.join(project_dir, "frameworks/WeChatGame/**"))
         .pipe(gulp.dest(publish_dir));
   }
});
gulp.task("project_res", ["project_clean"], function () {
   gulp.src(path.join(project_dir, "res/**"))
      .pipe(gulp.dest(publish_res));
});
gulp.task("compileProject", ["project_res", "project_html"], function () {
   jsAddedCache = {};
   //frame js...
   var jsList = [];
   jsList.push(path.join(frame_dir, module_config["bootFile"]));
   for (var i = 0; i < project_json["modules"].length; i++) {
      var arr = getFileListOfModule(module_config["module"], project_json["modules"][i], ".js", frame_dir);
      if (arr) jsList = jsList.concat(arr);
   }
   //game js...
   var gameJsList = [];
   for (var i = 0; i < project_json["jsList"].length; i++) {
      var fileName = project_json["jsList"][i];
      if (path.extname(fileName) === ".js")
         gameJsList.push(path.join(project_dir, fileName));
   }
   var mainJs = project_json["main"] ? project_json["main"] : "main.js";
   gameJsList.push(path.join(project_dir, mainJs));

   jsList = jsList.concat(gameJsList);

   // console.log(jsList);
   console.log("Compiling " + jsList.length + " .js files...");
   return merge2(gulp.src(jsList))
      .pipe(concat(gameMinJsName))
      .pipe(uglify())
      .pipe(optimisejs())
      .pipe(compressCode())
      .pipe(gulp.dest(publish_dir))
});

gulp.task('help', function () {
   console.log('   gulp help           gulp参数说明');
   console.log('   -p 使用pako压缩代码');
});

gulp.task('default', function () {
   gulp.start('compileProject');
});
