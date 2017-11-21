var ejs = require('ejs');
var projectItem = document.getElementById('project-item-template').innerHTML;
var holder = document.getElementById('body');
var $ = require('jquery');
var path = require('path');
var ipc=require('electron').ipcRenderer;
var fs = require('fs');
//require('devtron').install();

holder.ondragover = function () {
    return false;
};
holder.ondragleave = holder.ondragend = function () {
    return false;
};
holder.ondrop = function (e) {
    e.preventDefault();
    var foldPath = path.join(e.dataTransfer.files[0].path);
    if(/\.(\w+)/.test(foldPath)){
        //过滤文件路径，将 "/TEMP/0.png" 转化为 "/TEMP"
      foldPath=path.dirname(foldPath);
    }
    appendSelect(foldPath);
};



function appendSelect(folderPath){
  console.log(folderPath)
  fs.readdir(folderPath, function(err, files) {
      if (err) {
          console.log('读取文件错误！');
          return false;
      } else {
      if (files.length) {
          var pngFiles = _.filter(files, function(file) {
              return file.indexOf(".png") > 0;
          })
          // var orderFiles = _.filter(pngFiles, function(file) {
          //     return (/^\d+\.\w+$/).test(file);
          // })
          //console.log(pngFiles,orderFiles)
          //判断目录下有无png图片
          if(pngFiles.length){
            //判断目录下的png图片是否为数字命名
            // if(orderFiles.length == pngFiles.length){
              //判断目录是否已经存在
              var result = folderPath;
              var foldData = window.localStorage.getItem("foldList") || "";
              var exist=foldData.indexOf(result);
              var sortFiles= _.sortBy(pngFiles,function(file){
                  var temp=parseInt(file.match(/\d+/)[0]);
                  return temp;
              })
              if(exist == -1){
                var thumb = sortFiles[Math.floor(sortFiles.length/2)];
                console.warn(thumb,sortFiles.length,sortFiles)
                var project = {src:result,dist:path.join(result,'output'),thumb:path.join(result,thumb)};
                var html = ejs.render(projectItem, { project: project });
                $("#select-folder").hide();
                $(".page-index").show();
                $('#folder-ul').append(html);
                saveFolder();
                console.log('File you dragged here is', result);
              }else{
                alert("该目录已经存在！");
                return false;
              }
            // }else{
            //   alert("该目录下的图片没有按数字序列命名！");
            //   return false;
            // }
          }else{
            alert("该目录下没有图片！");
            return false;
          }
        }else{
          return false;
        }
      }
    })

}


$("#select-folder").click(function(){
    ipc.send('open-fold-dialog');
    return false;
})

$("#folder-ul").on("click",".folder-dist",function(){
    //ipc.send('open-error-box');
    var $item=$(this).parents("li");
    var dist=$item.data("dist");
    var order=$item.index();
    console.log(dist,order)
    ipc.send('change-fold-dialog',dist,order);
    return false;
})
$(".page-index").on("click",".side-bar",function(event){
    event.stopPropagation();
})


$("#folder-ul").on("click","li",function(){
    $("#folder-ul li").removeClass("current");
    $(this).addClass("current");
    $(".page-index").addClass("sidebar-show");
    event.stopPropagation();
})

$("#folder-ul").on("mouseenter","li",function(){
    $(this).addClass("hover");
})

$("#folder-ul").on("mouseleave","li",function(){
    $(this).removeClass("hover");
})

$(".page-index").on("click",function(){
    $(".page-index li").removeClass("current");
    $(this).removeClass("sidebar-show");
})

ipc.on('selected-directory', function (event, path) {
  appendSelect(path[0]);
  //console.log(`${path}`)
})

ipc.on('change-directory', function (event, path,order) {
  //console.log(order);
  var $item=$(".page-index li").eq(order);
  $item.attr("data-dist",path);
  $item.find(".folder-dist").html("→ "+path);
  saveFolder();
  //console.log(`${path}`)
})

function saveFolder(){
  var data=[];
  var $foldList=$("#folder-ul li");
  if($foldList.length == 0 ){
    $("#select-folder").show();
    $(".page-index").hide();
    window.localStorage.setItem("foldList","");
  }else{
    $foldList.each(function(){
      //console.log($(this));
      data.push({"src":$(this).attr("data-src"),"dist":$(this).attr("data-dist"),"thumb":$(this).attr("data-thumb")});
    })
    window.localStorage.setItem("foldList",JSON.stringify(data));
    //console.log(data,JSON.stringify(data));
  }

}

function readFolder(){
  //console.log(window.localStorage.getItem("foldList"));
  var foldData = window.localStorage.getItem("foldList");
  if(foldData){
    var foldList=JSON.parse(foldData);
    for(var i=0;i<foldList.length;i++){
      var project = {src:foldList[i]["src"],dist:foldList[i]["dist"],thumb:foldList[i]["thumb"]};
      var html = ejs.render(projectItem, { project: project });
      $("#select-folder").hide();
      $(".page-index").show();
      $('#folder-ul').append(html);
    }
  }

}

readFolder();


var remote=require('electron').remote;
const shell = require('electron').shell;
const {Menu, MenuItem} = remote;

const menu = new Menu();
menu.append(new MenuItem({label: '打开源目录', click() {
  var srcPath=$('#folder-ul li.hover').attr("data-src");
  shell.showItemInFolder(srcPath)
}}))
menu.append(new MenuItem({label: '打开输出目录', click() {
  var distPath=$('#folder-ul li.hover').attr("data-dist");
  fs.exists(distPath, function (exists) {
      if(!exists){
          fs.mkdirSync(distPath);
      }
  })
  shell.showItemInFolder(distPath)
}}))
menu.append(new MenuItem({label: '修改输出目录', click() {
  var $item = $('#folder-ul li.hover');
  var dist=$item.data("dist");
  var order=$item.index();
  ipc.send('change-fold-dialog',dist,order);
  saveFolder();
}}))
menu.append(new MenuItem({type: 'separator'}))
menu.append(new MenuItem({label: '删除项目', click() {
  $('#folder-ul li.hover').remove();
  saveFolder();
}}))

$("#folder-ul")[0].addEventListener('contextmenu', (e) => {
  e.preventDefault()
  menu.popup(remote.getCurrentWindow())
}, false)
