var holder = document.getElementById('holder');
var $ = require('jquery');

  holder.ondragover = function () {

    $('#holder').addClass('holder-over');
    return false;
  };
  holder.ondragleave = holder.ondragend = function () {

    $('#holder').removeClass('holder-over');
    return false;
  };
  holder.ondrop = function (e) {
    e.preventDefault();
    var file = e.dataTransfer.files[0];
    console.log('File you dragged here is', file.path);
    $('#holder').removeClass('holder-over');
    return false;
  };
