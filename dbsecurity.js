var sql = require("mssql");

    // config for your database
    var config = {
        user: process.env.USERSECURITY,
        password: process.env.PASSWORDSECURITY,
        server: process.env.SERVERSECURITY,
        database: process.env.DATABASESECURITY,
        port: process.env.PORTDB,
        options: {
            encrypt: true, // for azure
            trustServerCertificate: true, // change to true for local dev / self-signed certs
            trustedConnection: true,
            enableArithAbort: true 
          },
    };

//Execute query against SQL Server
//sQuery : Query SQL to execute
//retunr: recordSet
exports.ExecuteQuery=(sQuery, callback)=>
    {
        try{
            sql.close();
            }
            catch(err)
            {

            }
        // connect to your database
        
        try
        {
        sql.connect(config, function (err) {
            if (err) {
                console.log(err);
                try{
                    sql.close();
                    }
                    catch(err)
                    {
        
                    }
                callback(err,null);
            }
            // create Request object
            var request = new sql.Request();
           /* for (var key in parameters) {
                if(key.startsWith("id"))
                    request.input(key , sql.Int,parameters[key]);
                else
                    request.input(key , parameters[key]);
            }*/
            // query to the database and get the records
            request.query(sQuery, function (err, result) {
                
                if (err) {

                    console.log(err);
                    try{
                        sql.close();
                        }
                        catch(err)
                        {
            
                        }
                    callback(err,null);
                    return;
                }
    
             // send records as a response
             try{
                sql.close();
                }
                catch(err)
                {
    
                }
                if(result)
                    callback(null, result.recordset);
                else
                    callback(null, null);
                
            });
        });
     }
    catch(exc)
    {
       callback(exc, null);
    }
    }


 

