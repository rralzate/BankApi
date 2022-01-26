var azure = require('azure-storage');
var blobService = azure.createBlobService();
const containerName="detalleinspecciones";

exports.uploadStream =async  (blobFile, originalName, esquema, callback)=>{
     
     await  blobService.createContainerIfNotExists(esquema+'-'+containerName, {
        publicAccessLevel: 'blob'
      }, function(error, result, response) {
        if (!error) {
          // if result = true, container was created.
          // if result = false, container already existed.
    
      var rawdata =blobFile; 
      var matches = rawdata.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      var type = matches[1];
      var buffer = new Buffer(matches[2], 'base64');
     
      const blobName =originalName; 
       blobService.createBlockBlobFromText(esquema+'-'+containerName,blobName, buffer, {contentType:type},
       function(error, result, response) {
          if (error) {
              console.log(error);
              return callback(error,null );  
          }else{
          console.log(result);
          return callback(null, originalName);
          }
      });
    }
    else
    {
      return callback(error, null);

    }
  });//fin crear container


  };
