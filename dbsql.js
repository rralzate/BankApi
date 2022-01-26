var sql = require("mssql");

    // config for your database
    var config = {
        user: process.env.USERDB,
        password: process.env.PASSWORDDB,
        server: process.env.SERVERDB,
        database: process.env.DATABASE,
        port: process.env.PORTDB,
        requestTimeout : 5000000,
        connectionTimeout: 15000,
        options: {
            encrypt: true, // for azure
            trustServerCertificate: true, // change to true for local dev / self-signed certs
            trustedConnection: true, 
            enableArithAbort: true
          },
          typeCast: function castField( field, useDefaultTypeCasting ) {

        // We only want to cast bit fields that have a single-bit in them. If the field
        // has more than one bit, then we cannot assume it is supposed to be a Boolean.
        if ( ( field.type==sql.BIT()) && ( field.length === 1 ) ) {
            console.log("transformado!!");
            console.log(field);
            var bytes = field.buffer();

            // A Buffer in Node represents a collection of 8-bit unsigned integers.
            // Therefore, our single "bit field" comes back as the bits '0000 0001',
            // which is equivalent to the number 1.
            return( bytes[ 0 ] === 1 ); 

        }

        return( useDefaultTypeCasting() );

    }
       // port:process.env.PORTDB,
       
    };

//Execute query against SQL Server
//sQuery : Query SQL to execute
//retunr: recordSet
exports.ExecuteQuery=(sQuery, callback)=>
    {
        console.log(sQuery);
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

    //Execute query against SQL Server
//sQuery : Query SQL to execute
//return: recordSet
exports.ExecuteProcedure=(sProcedure, parameters, callback)=>
{

    // connect to your database
    try{
        sql.close();
        }
        catch(err)
        {

        }
    sql.connect(config, function (err) {
    
        if (err) {
            console.log(err);
            callback(err,null);
            try{
            sql.close();
            }
            catch(err)
            {

            }
        }
        // create Request object
        var request = new sql.Request();
        for (var key in parameters) {
            if(key.startsWith("id"))
                request.input(key , sql.Int,parameters[key]);
            else
                request.input(key , parameters[key]);
        }
        // query to the database and get the records
        request.execute(sProcedure, function (err, result, returnValue) {
            
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



 

