var command = {
  "darwin": {
      "alpha_remove": function(parmObj) {
          if (parmObj.isMultiple) {
              const image = sharp(parmObj.filePath);
              image.metadata().then(function(metadata) {
                  var imgWidth = metadata.width;
                  var imgHeight = metadata.height;
                  var destWidth = 16 * Math.floor(imgWidth / 16);
                  var destHeight = 16 * Math.floor(imgHeight / 16);
                  return image
                      .resize(destWidth, destHeight)
                      .toFile(parmObj.distFilePath + parmObj.fileName + 'rgb.jpg', function(err) {
                          sharp(parmObj.filePath)
                              .metadata()
                              .then(function(metadata) {
                                  //console.log(metadata);
                              })
                      });
              })
          } else {
              sharp(filePath)
                  .toFile(distFilePath + fileName + 'rgb.jpg', function(err) {
                      sharp(filePath)
                          .metadata()
                          .then(function(metadata) {
                              //console.log(metadata);
                          })
                  });
          }
      },
      "alpha_extract": function(parmObj) {
          if (parmObj.isMultiple) {
              const image = sharp(parmObj.filePath);
              image.metadata().then(function(metadata) {
                  var imgWidth = metadata.width;
                  var imgHeight = metadata.height;
                  var destWidth = 16 * Math.floor(imgWidth / 16);
                  var destHeight = 16 * Math.floor(imgHeight / 16);
                  return image
                      .resize(destWidth, destHeight)
                      .extractChannel(3)
                      .background('#000000')
                      .toFile(parmObj.distFilePath + parmObj.fileName + 'alpha.png', function(err) {
                          parmObj.cb();
                      });
              })
          } else {
              sharp(parmObj.filePath)
                  .extractChannel(3)
                  .background('#000000')
                  .toFile(parmObj.distFilePath + parmObj.fileName + 'alpha.png', function(err) {
                      parmObj.cb();
                  });
          }
      }
  },
  "win32": {
      "alpha_remove": function(parmObj) {

      },
      "alpha_extract": function(parmObj) {
      }
  }
};

module.exports = command;
