var fs = require('fs');
var path = require('path');
var $ = require('jquery');
var execSync = require('child_process').execSync;
var async = require('async');
var _ = require('underscore');
var ipc = require('electron').ipcRenderer;
var os = require('os');
var platform = os.platform();
//var command = require('command');

var Config = {};
var imPath = "";
var FFmpegExe;
ipc.send('get-app-path');
ipc.on('got-app-path', function(event, appPath) {
  //console.log(process.resourcesPath,appPath)
  var winImPath = path.join(appPath, "assets/tools/win/imageMagick/");
  var winFFmpeg = path.join(appPath, "assets/tools/win/ffmpeg-win32-static/bin/ffmpeg");
  var macImPath = path.join(appPath, "assets/tools/mac/imageMagick/bin/");
  var macFFmpeg = path.join(appPath, "assets/tools/mac/ffmpeg/ffmpeg");
  if (platform == "darwin") {
    imPath = macImPath;
    FFmpegExe = macFFmpeg;
  } else if (platform == "win32") {
    imPath = winImPath;
    FFmpegExe = winFFmpeg;
  } else {
    alert("暂不支持此平台！");
  }
})





// 解决mac下报错问题：https://github.com/aheckmann/gm/issues/455
//var gm = require('gm').subClass({imageMagick: true});

//修复mac下环境路径出错导致command执行不了的问题：https://github.com/electron/electron/issues/7688
const fixPath = require('fix-path');
fixPath();
//console.log(process.env.PATH);

var exec = require('child_process').exec;
//detect imageMagick lib
// exec('convertt -version',function(error,stdout,stderr){
//   console.log('stdout: ' + stdout);
//   console.log('stderr: ' + stderr);
//   if (error !== null) {
//     console.log('exec error: ' + error);
//     exec('open assets/resource/ImageMagick.pkg',function(error,stdout,stderr){
//       console.log('stdout: ' + stdout);
//       console.log('stderr: ' + stderr);
//     });
//   }
// })

function progress(item, stage, ratio) {
  var ratio = ratio.toFixed(2);
  var precent = ratio * 100;
  var totalProgress = 0;
  switch (stage) {
    case 1:
      totalProgress = 10;
      break;
    case 2:
      totalProgress = (10 + precent * 0.6).toFixed(2);
      break;
    case 3:
      totalProgress = (60 + precent * 0.2).toFixed(2);
      break;
    case 4:
      totalProgress = 90 + precent * 0.1;
      break;
    default:
      break;
  }
  console.log("进度：" + totalProgress + "%")
  item.find(".mod-progress").show().width(totalProgress + "%");
}

function fileCopy(filename1, filename2, done) {
  var input = fs.createReadStream(filename1);
  var output = fs.createWriteStream(filename2);
  input.on('data', function(d) {
    output.write(d);
  });
  input.on('error', function(err) {
    throw err;
  });
  input.on('end', function() {
    output.end();
    if (done) done();
  });
}

$('#val-16x').on('change', function() {
  this.value = this.checked ? 1 : 0;
  // alert(this.value);
}).change();


$('#folder-ul').on('click', '.ladda-button', function(event) {
  $(".page-index").removeClass("sidebar-show");
  event.stopPropagation();
  var src_dir = $(this).parent().attr('data-src');
  var dist_dir = $(this).parent().attr('data-dist');
  var temp_dir = path.join($(this).parent().attr('data-src'), ".convert-cache");
  var laddaBtn = Ladda.create($(this)[0]);
  var currentItem = $(this).parent("li");
  var fps = $("#val-fps").val();
  var kpbs = $("#val-kpbs").val();
  var multiple = $("#val-16x").val();
  Config["fps"] = fps;
  Config["kpbs"] = kpbs;
  Config["multiple"] = parseInt(multiple);
  Config["direction"] = $("input[name=direction]:checked").val();
  laddaBtn.start();
  //console.log(src_dir,dist_dir,temp_dir);
  async.waterfall([
    function(callback) {
      //console.log(process.env.PATH)
      console.log('第一步');
      fs.exists(src_dir, function(e) {
        if (e) {
          fs.readdir(src_dir, function(err, files) {
            if (err) {
              console.log('读取文件错误！');
            } else {
              //建立临时目录
              fs.exists(temp_dir, function(exists) {
                if (!exists) {
                  fs.mkdirSync(temp_dir);
                  console.log('临时目录创建成功');
                }
                if (files.length) {
                  var pngFiles = _.filter(files, function(file) {
                    return file.indexOf(".png") > 0;
                  })

                  //过滤png序列帧图片
                  let tempPrefix = {}
                  for (var i = 0; i < pngFiles.length; i++) {
                    let prefixpath = path.dirname(pngFiles[i])
                    let prefixname = path.basename(pngFiles[i]).replace(/\d+\.png$/i, '')
                    let prefix = prefixpath + prefixname
                    // console.log(prefix)
                    if (!tempPrefix[prefix]) {
                      tempPrefix[prefix] = []
                      tempPrefix[prefix].push(pngFiles[i])
                    } else {
                      tempPrefix[prefix].push(pngFiles[i])
                    }
                  }
                  // console.log(tempPrefix)
                  let arrayLength = 1;
                  let tempFile = {}
                  for (var i in tempPrefix) {
                    if (tempPrefix[i].length > arrayLength) {
                      arrayLength = tempPrefix[i].length;
                      tempFile[arrayLength] = tempPrefix[i];
                    }
                  }
                  let listPng = tempFile[arrayLength];
                  // console.log(tempFile)
                  let count=0;
                  for (var i = 0; i < listPng.length; i++) {
                    fileCopy(path.join(src_dir, listPng[i]), path.join(temp_dir, i + ".png"), function() {
                      count ++
                      if(count == listPng.length){
                        // console.log(count+"copy done");
                        // pngFiles = pngFiles.sort();
                        var parmObj = {
                          "filePath": '"' + path.join(temp_dir, "0.png") + '"',
                          "cb": function(imgWidth, imgHeight) {
                            callback(null, imgWidth, imgHeight, temp_dir);
                          }
                        }
                        // console.log(parmObj)

                        //get image dimension
                        Command["get_dimension"](parmObj);
                        progress(currentItem, 1, 1);
                      }
                    })
                  }
                }
              })
            }
          })
        }
      });
    },
    function(imgWidth, imgHeight, temp_dir, callback) {
      // console.log(imgWidth, imgHeight)
      //return false;
      console.log('第二步');
      fs.readdir(temp_dir, function(err, files) {
        var pngFiles = _.filter(files, function(file) {
          return file.indexOf(".png") > 0;
        })
        pngFiles = pngFiles.sort();
        var count = 0;
        pngFiles.forEach(function(file, index) {
          var fileExt = path.extname(file);
          var filePath = '"' + path.join(temp_dir, file) + '"';
          var fileName = path.basename(file, '.png');
          var parmObj1 = {
            "filePath": filePath,
            "fileName": fileName,
            "imgWidth": imgWidth,
            "imgHeight": imgHeight,
            "distFilePath": temp_dir,
            "isMultiple": Config["multiple"]
          }

          var parmObj2 = {
            "filePath": filePath,
            "fileName": fileName,
            "imgWidth": imgWidth,
            "imgHeight": imgHeight,
            "distFilePath": temp_dir,
            "isMultiple": Config["multiple"],
            "cb": function(imgWidth, imgHeight) {
              count++;
              progress(currentItem, 2, count / pngFiles.length);
              //console.warn(count,pngFiles.length);
              if (count == pngFiles.length) {
                callback(null, imgWidth, imgHeight);
              }
            }
          }
          // console.log(parmObj1)
          Command["alpha_remove"](parmObj1);
          Command["alpha_extract"](parmObj2);
        });
      })
    },
    function(imgWidth, imgHeight, callback) {
      console.log('第三步');
      //return false;
      //console.log(imgWidth, imgHeight);
      fs.exists(temp_dir, function(e) {
        if (e) {
          fs.readdir(temp_dir, function(err, files) {
            if (err) {
              console.log('读取文件错误！');
            } else {
              //console.log(files);
              if (files.length) {
                var pngFiles = _.filter(files, function(file) {
                  return file.indexOf("alpha.png") > 0;
                })
                //console.log(pngFiles)
                var orderFilesSort = _.sortBy(pngFiles, function(file) {
                  return parseInt(file.replace(/alpha\.png/, ''));
                });
                //console.log(orderFilesSort)
                var resultFiles = _.map(orderFilesSort, function(file) {
                  return file.replace(/alpha/, '')
                })
                //console.log(resultFiles)
                var count = 0;
                var direction = "row";
                if (Config.direction == "auto") {
                  if (imgWidth / imgHeight > 1) {
                    direction = "column";
                  } else {
                    direction = "row"
                  }
                } else {
                  direction = Config.direction;
                }
                Promise.all(resultFiles.map(function(file, index) {
                  //console.log('Promise');
                  new Promise(function(resolve, reject) {
                    var fileName = path.basename(file, '.png'),
                      rgbFile = path.join(temp_dir, fileName + 'rgb.jpg'),
                      alphaFile = path.join(temp_dir, fileName + 'alpha.png');
                    var parmObj = {
                      "rgbFile": '"' + rgbFile + '"',
                      "alphaFile": '"' + alphaFile + '"',
                      "combineWidth": imgWidth,
                      "combineHeight": imgHeight,
                      "combineDirection": direction,
                      "fileName": index,
                      "distFilePath": temp_dir,
                      "platform": platform,
                      "cb": function() {
                        count++;
                        fs.unlinkSync(rgbFile);
                        fs.unlinkSync(alphaFile);
                        resolve();
                        progress(currentItem, 3, count / resultFiles.length);
                        if (count == resultFiles.length) {
                          callback();
                        }
                      }
                    }
                    Command["combine_images"](parmObj);
                  })
                }))
              }
            }

          })
        }
      });
    },
    function(callback) {
      //return false;
      console.log('第四步');
      fs.exists(dist_dir, function(exists) {
        if (!exists) {
          fs.mkdirSync(dist_dir);
          console.log('输出目录创建成功');
        }
        fs.readdir(temp_dir, function(err, files) {
          if (err) {
            console.log('读取文件错误！');
          } else {
            if (platform == "darwin") {
              var cmdStr = "cd " + '"' + temp_dir + '"' + " && " + '"' + FFmpegExe + '"' + " -r " + Config["fps"] + " -i 'frame%d.jpg' -vcodec libx264  -profile:v baseline -level 3.0 -pix_fmt yuv420p -b:v " + Config["kpbs"] + "k -bf 0 -nostdin -y cache.mp4";

            } else {
              var pan = temp_dir.substr(0, 2);
              var cmdStr = pan + '&& cd ' + temp_dir + ' && ' + '"' + FFmpegExe + '"' + ' -r  ' + Config["fps"] + ' -i frame%d.jpg -vcodec libx264  -profile:v baseline -level 3.0 -pix_fmt yuv420p -b:v ' + Config["kpbs"] + 'k -bf 0 -nostdin -y cache.mp4';
            }
            var delTempFiles = "rm -rf " + '"' + temp_dir + '"';
            exec(cmdStr, function(err, out) {
              // console.warn("执行命令5：" + cmdStr);
              fileCopy(path.join(temp_dir, "cache.mp4"), path.join(dist_dir, "output.mp4"), function() {
                exec(delTempFiles, function(err, out) {
                  //console.warn("执行命令6："+delTempFiles);
                  progress(currentItem, 4, 1);
                  laddaBtn.stop();
                  setTimeout(function() {
                    $(".mod-progress").width("0%").hide();
                    //shell.showItemInFolder(dist_dir);
                    alert("转换完成");
                  }, 300)
                });
              })
            });
          }
        })
      })
    }

  ]);

});


var Command = {
  "get_dimension": function(parmObj) {
    var cmdStr = '"' + imPath + 'identify" -format %w,%h ' + parmObj.filePath;
    exec(cmdStr, function(err, out) {
      //console.warn("执行命令1：" + cmdStr);
      var imgWidth = out.split(",")[0];
      var imgHeight = out.split(",")[1];
      parmObj.cb(imgWidth, imgHeight);
    })
  },
  "alpha_remove": function(parmObj) {
    var imgWidth = parmObj.imgWidth;
    var imgHeight = parmObj.imgHeight;
    if (parmObj.isMultiple) {
      var destWidth = 16 * Math.floor(imgWidth / 16);
      var destHeight = 16 * Math.floor(imgHeight / 16);
      var cmdResize = " -resize " + destWidth + "x" + destHeight + "!";
      var cmdStr = '"' + imPath + 'convert" ' + parmObj.filePath + cmdResize + ' -background \"#000000\" -alpha remove ' + '"' + path.join(parmObj.distFilePath, parmObj.fileName + 'rgb.jpg') + '"';
      exec(cmdStr, function(err, out) {
        // console.warn("执行命令2：" + cmdStr);
      })
    } else {
      var cmdStr = '"' + imPath + 'convert" ' + parmObj.filePath + ' -background \"#000000\" -alpha remove ' + '"' + path.join(parmObj.distFilePath, parmObj.fileName + 'rgb.jpg') + '"';
      exec(cmdStr, function(err, out) {
        // console.warn("执行命令2：" + cmdStr);
      })
    }
  },
  "alpha_extract": function(parmObj) {
    var imgWidth = parmObj.imgWidth;
    var imgHeight = parmObj.imgHeight;
    if (parmObj.isMultiple) {
      var destWidth = 16 * Math.floor(imgWidth / 16);
      var destHeight = 16 * Math.floor(imgHeight / 16);
      var cmdResize = ' -resize ' + destWidth + 'x' + destHeight + '!';
      var cmdStr = '"' + imPath + 'convert" ' + parmObj.filePath + cmdResize + ' -alpha extract ' + '"' + path.join(parmObj.distFilePath, parmObj.fileName + 'alpha.png') + '"';
      exec(cmdStr, function(err, out) {
        //console.warn("执行命令3：" + cmdStr);
        parmObj.cb(destWidth, destHeight);
      })
    } else {
      var cmdStr = '"' + imPath + 'convert" ' + parmObj.filePath + ' -alpha extract ' + '"' + path.join(parmObj.distFilePath, parmObj.fileName + 'alpha.png') + '"';
      exec(cmdStr, function(err, out) {
        //console.warn("执行命令3：" + cmdStr);
        parmObj.cb(imgWidth, imgHeight);
      })
    }
  },
  "combine_images": function(parmObj) {
    if (parmObj.combineDirection == "row") {
      var cmdStr = '"' + imPath + 'convert"  +append ' + parmObj.alphaFile + ' ' + parmObj.rgbFile + ' ' + '"' + path.join(parmObj.distFilePath, 'frame' + parmObj.fileName + ".jpg") + '"';
      exec(cmdStr, function(err, out) {
        //console.warn("执行命令4：" + cmdStr);
        parmObj.cb();
      })
    } else {
      var cmdStr = '"' + imPath + 'convert"  -append ' + parmObj.alphaFile + ' ' + parmObj.rgbFile + ' ' + '"' + path.join(parmObj.distFilePath, 'frame' + parmObj.fileName + ".jpg") + '"';
      exec(cmdStr, function(err, out) {
        //console.warn("执行命令4：" + cmdStr);
        parmObj.cb();
      })
    }
  }
};
