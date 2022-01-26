const dbSQL=require('../dbsql');
const dbSQLSec=require('../dbsecurity');
const async = require('async');
const moment= require('moment');
const blobStorage= require('../middlewares/blobstorage');
const { DateTime } = require('mssql');
var sEsquemaDB="";
//Consulta el esquema por usuario
function queryEsquemaDB(userrName,callback){

    var queryUser="select Emp_Esquema from SBRT_Usuario U join SBRT_Empresa E on u.Emp_Id=e.Emp_Id WHERE Ide_Usuario='"+userrName+"'";
    dbSQLSec.ExecuteQuery(queryUser,
        (err,esquema)   =>
        {
            if(err){
                callback(err,null);
                return;
                
            }
            if(esquema!=null && esquema[0]!=null)  
                callback(null,esquema[0].Emp_Esquema );
            else
                callback (new Error("Usuario no tiene pertenece a ninguna empresa definida"),null);
        });

}

//Validate Token user
function queryTokenUser(userrName,userToken,sEsquema,callback){

    var queryUser="SELECT * FROM "+sEsquema+".USU_Usuarios (nolock) u join "+sEsquema+".TUS_TockensUsuarios (nolock) t on u.USU_Id=t.USU_Id where Ide_Usuario='"+userrName+"' and TUS_Token='"+userToken+"' and t.TUS_Activo =1";
    dbSQL.ExecuteQuery(queryUser,
        (err,tokens)   =>
        {
            if(err){
                callback(err,null);
                return;
                
            }
            if(tokens!=null && tokens.length>0)  
                callback(null, true );
            else
                callback (null,false);
        });

}

exports.GuardarImagen= (req,res) =>{

    if(sEsquemaDB=="")
    sEsquemaDB="COL_divertronica";
    dbSQL.ExecuteProcedure(sEsquemaDB+".ObtenerSyncroImagenes",{},
            (err,infoDetails)   =>
                {
                    if(err){
                        //callback(err);
                        console.log(err);
                        return;

                    }
                    //1.
                    var contador=0;
                    for(var i=0;i<infoDetails.length;i++)
                    {
                        var foto= infoDetails[i].Foto;
                        if(!infoDetails[i].Foto.startsWith("data:image/jpeg;base64"))
                        {
                            foto="data:image/jpeg;base64,"+infoDetails[i].Foto;
                            foto= foto.replace(/\n|\r/g, "");
                        }
                        
                        
                        blobStorage.uploadStream(foto,infoDetails[i].Nombre,sEsquemaDB.split("_").pop(), 
                        (err, fileName)=>{
                            if(err)
                               {
                                   //callback(err);
                                   console.log("Error guardando Imagen:"+fileName+ " en Storage");
                                   console.log(err);
                                   return;
                               }
                               else 
                               {
                                    console.log("Imagen:"+fileName+ " GUARDADA en Storage");
                                    contador++;
                                    if(contador==infoDetails.length)
                                    {
                                        dbSQL.ExecuteProcedure(sEsquemaDB+".ProcesarSyncroImagenes",{},
                                        (err,infoDetails)   =>
                                        {
                                            if(err){
                                                console.log(err);
                                                return;
                                                
                                            }
                                            //0.
                                        
                                        // callback(null);
                                        });
                                        res.status(200).json("{mensaje:imagenes subidas al storage}");
                                        return;  
                                }

                               }
                
                        });

                    }
                    if(infoDetails.length==0)
                    {

                        res.status(200).json("{mensaje:imagenes subidas al storage}");
                        return; 
                    }
                   
                }); 

}

//Consulta para descarga de inforamcion de SYNC
exports.DescargarInformacionSincronizacion=(req,res) =>{

    const userName = req.body.NombreUsuario;
    const tokenUser=req.body.Token
    const dateSync = req.body.FechaUltimaSincronizacion || "2000-01-01";
    var InformacionSincronizacionMovil={Mensaje:"OK"};
    var idEntidad=req.body.EST_Id;
    var parametersQuery={
        "fecha":dateSync,
        "idEntidad":idEntidad
    }

    var parameterSync={
        "jsonSync":JSON.stringify( req.body)
       
    }
    console.log("parameters");
    console.log(parametersQuery);
    var sEsquemaDB="";
   
    async.series([
     
            function getEsquemna(callback)
            {
             queryEsquemaDB(req.body.NombreUsuario,
                (err, result)=>{
                    if(err)
                    {
                        callback(err);
                        return;
                    }

                    sEsquemaDB=result;
                   
                    callback(null);

                }
                )
            },

            function validateToken(callback)
            {
                queryTokenUser(userName,tokenUser,sEsquemaDB,
                    (err,tokenValid)   =>
                    {
                        if(err){
                            callback(err);
                            return;
                            
                        }
                        if(!tokenValid || tokenValid==false)
                        {
                            InformacionSincronizacionMovil.CodigoError=2;//token invalido
                            callback(new Error("Token invalido"));
                            return;
                        }
                        callback(null);
                    
                    }
                );
            },
            function IniciarSincronizacion(callback)
            {
                dbSQL.ExecuteProcedure(sEsquemaDB+".IniciarProcesoincronizacion",parameterSync,
                    (err,infoDetails)   =>
                    {
                        if(err){
                            callback(err);
                            return;
                            
                        }
                        //0.
                       
                        callback(null);
                    });
            },
            function SaveImages(callback)
            {
                if(sEsquemaDB=="")
                sEsquemaDB="COL_divertronica";
                dbSQL.ExecuteProcedure(sEsquemaDB+".ObtenerSyncroImagenes",{},
                (err,infoDetails)   =>
                {
                    if(err){
                        callback(err);
                        return;

                    }
                    //1.
                    var contador=0;
                    for(var i=0;i<infoDetails.length;i++)
                    {
                        var foto= infoDetails[i].Foto;
                        if(!infoDetails[i].Foto.startsWith("data:image/jpeg;base64"))
                        {
                            foto="data:image/jpeg;base64,"+infoDetails[i].Foto;
                            foto= foto.replace(/\n|\r/g, "");
                        }
                        blobStorage.uploadStream(foto,infoDetails[i].Nombre,sEsquemaDB.split("_").pop().toLowerCase(), 
                        (err, fileName)=>{
                            if(err)
                               {
                                   console.log("Error guardando Imagen:"+fileName+ " en Storage");
                                   callback(err);
                                   return;
                               }
                               else 
                               {
                                    console.log("Imagen:"+fileName+ " GUARDADA en Storage");
                                    contador++;
                                    if(contador==infoDetails.length)
                                    {
                                        dbSQL.ExecuteProcedure(sEsquemaDB+".ProcesarSyncroImagenes",{},
                                        (err,infoDetails)   =>
                                        {
                                            if(err){
                                                console.log(err);
                                                return;
                                                
                                            }
                                            else
                                            {
                                                callback(null);
                                            }
                                        
                                        
                                        });
                                       
                                    }

                               }
                              
                
                    }
                    
                    );

                    }
                    if(infoDetails.length==0)
                    {

                        callback(null);
                    }
                    //callback(null);
                });  

            },
           
            
            function ProcesarImagenes(callback)
            {
                dbSQL.ExecuteProcedure(sEsquemaDB+".ProcesarSyncroImagenes",{},
                (err,infoDetails)   =>
                {
                    if(err){
                        callback(err);
                        return;
                        
                    }
                    callback(null);
                });

            },
            function queryDispositivosEntretenimiento(callback)
            {
                dbSQL.ExecuteProcedure(sEsquemaDB+".ConsultarDispositivosEntretenimientoSincronizacion",parametersQuery,
                    (err,infoDetails)   =>
                    {
                        if(err){
                            callback(err);
                            return;
                            
                        }
                        //1.
                        InformacionSincronizacionMovil.ListaDispositivosEntretenimiento=infoDetails;
                        callback(null);
                    });
            }

            ,
            function queryParametrosDocumentos(callback)
            {
                dbSQL.ExecuteProcedure(sEsquemaDB+".spConsultarParametrosDocumentosSincronizacion",parametersQuery,
                    (err,infoDetails)   =>
                    {
                        if(err){
                             callback(err);
                            return;

                        }
                        //1.
                        InformacionSincronizacionMovil.ListaParametrosDocumentos=infoDetails;
                        callback(null);
                    });
            }
            ,
            function queryDetalleInspeccion(callback)
            {
                dbSQL.ExecuteProcedure(sEsquemaDB+".spConsultarDetalleInspeccionesSincronizacion",parametersQuery,
                    (err,infoDetails)   =>
                    {
                        if(err){
                             callback(err);
                            return;

                        }
                        //1.
                        InformacionSincronizacionMovil.ListaDetalleInspecciones=infoDetails;
                        callback(null);
                    });
            }
            ,
            function queryDocumentos(callback)
            {
                dbSQL.ExecuteProcedure(sEsquemaDB+".spConsultarDocumentosSincronizacion",parametersQuery,
                    (err,infoDetails)   =>
                    {
                        if(err){
                            callback(err);
                            return;

                        }
                        //1.
                        InformacionSincronizacionMovil.ListaDocumentos=infoDetails;
                        callback(null);
                    });
            }
           


        ],
        function (err) //This function gets called after the two tasks have called their "task callbacks"
        {
        if (err) {
            var codError=3;
            if(err.message=="Token Invalido")
            {
                codError=3
            }
            
            res.status(500).jsonp({
            CodigoError: codError,
            Mensaje:err.message
            });
            console.log(err.message);
            return; 
        } else {
            if(InformacionSincronizacionMovil.CodigoError==null)
            {
                InformacionSincronizacionMovil.FechaUltimaSincronizacion=dateSync;
                InformacionSincronizacionMovil.FechaUltimaSincronizacionStr=moment(dateSync).format("YYYY-MM-DD HH:mm:ss");
                InformacionSincronizacionMovil.EST_Id=idEntidad;
                if(req.body.NumDiasLimite){
                    var  fechaLim =  moment().add(-req.body.NumDiasLimite,'days');
                    InformacionSincronizacionMovil.FechaLimite = fechaLim;
                }
                
            }
            res.status(200).json(InformacionSincronizacionMovil);
            return;  
        }

        }
    ); //end async
}

exports.ConsultarEsquemaDB= (req,res) =>{

    const userName = req.body.NombreUsuario;
    var sEsquemaDB = "";
    var Esquema={Mensaje:"OK"};

    try
    {
      queryEsquemaDB(userName,
        (err, result)=>{
            if(err)
            {
                callback(err);
                return;
            }
            sEsquemaDB=result; 
            Esquema.NombreEsquema =  sEsquemaDB;
            res.status(200).json(Esquema);
            return;                       
        }
        )        
    }
    catch(err)
    {    
        return res.status(500).jsonp({error:"Invalid request User Name"});
    }
}

exports.ConsultarCentralRiesgos= (req,res) =>{

    const userFirstName = req.body.PrimerNombre;
    const userSecondName = req.body.SegundoNombre;
	const userLastName = req.body.PrimerApellido;
	const userSecondLastName = req.body.SegundoApellido;
	const userDocumentType = req.body.TipoDocumento;
	const userDocumentNumber = req.body.NumeroDocumento;
	const userEmail = req.body.Email;
	const userPhoneNumber = req.body.NumeroCelular;

    req.assert('PrimerNombre', 'PrimerNombre cannot be blank').notEmpty();
    
    req.assert('PrimerApellido', 'PrimerApellido cannot be blank').notEmpty();
    req.assert('SegundoApellido', 'SegundoApellido cannot be blank').notEmpty();
    req.assert('TipoDocumento', 'TipoDocumento cannot be blank').notEmpty();
    req.assert('NumeroDocumento', 'NumeroDocumento cannot be blank').notEmpty();
    req.assert('NumeroCelular', 'NumeroCelular cannot be blank').notEmpty();

    const errors = req.validationErrors();

    if (errors) {
        res.status(401);
        res.json({
          "status": 401,
          "message": "Invalid request",
          "errors": errors
        });
        return;
      }
    
    var Respuesta1={Calificacion:"A"};
    var Respuesta2={Calificacion:"AA"};
    var Respuesta3={Calificacion:"AAA"};

    try
    {

        queryCreateUser(userFirstName, userSecondName, userLastName, userSecondLastName, userDocumentType, userDocumentNumber, userEmail, userPhoneNumber,
            (err, result)=>{
                if(err)
                {
                    callback(err);
                    return;
                }                   
            }
            ) 

        var calificacion = Math.floor(Math.random() * 100);

        if(calificacion > 0 && calificacion < 20)
        {
            res.status(200).json(Respuesta1);
        }else  if(calificacion > 20 && calificacion < 50)
        {
            res.status(200).json(Respuesta2);
        }else  if(calificacion > 50 && calificacion < 100)
        {
            res.status(200).json(Respuesta3);
        }else{
            res.status(200).json(Respuesta1);
        }        
      return;                              
    }
    catch(err)
    {    
        return res.status(500).jsonp({error:"Invalid request"});
    }
}



exports.RegistrarCreditoUsuario= (req,res) =>{
    
	const userDocumentNumber = req.body.NumeroDocumento;	
    const userCalification = req.body.Calificacion;
    
    req.assert('NumeroDocumento', 'NumeroDocumento cannot be blank').notEmpty();   
    req.assert('Calificacion', 'Calificacion cannot be blank').notEmpty();

    const errors = req.validationErrors();

    if (errors) {
        res.status(401);
        res.json({
          "status": 401,
          "message": "Invalid request",
          "errors": errors
        });
        return;
      }
    
    var Respuesta={Mensaje:"OK"};

    try
    {
        querySelectUser(userDocumentNumber,
            (err, resultUsuario)=>{
                if(err)
                {
                    callback(err);
                    return;
                } 
                queryCreateCredit(resultUsuario, userCalification,
                    (err, resultCredit)=>{
                        if(err)
                        {
                            callback(err);
                            return;
                        } 
                        res.status(200).json(Respuesta);
                        return;  
                    });
            });     
      
    }
    catch(err)
    {    
        return res.status(500).jsonp({error:"Invalid request"});
    }
}

function queryCreateUser(userFirstName, userSecondName, userLastName, userSecondLastName, userDocumentType, userDocumentNumber, userEmail, userPhoneNumber, callback){

     querySelectUser(userDocumentNumber,
        (err, resultUsuario)=>{
            if(err)
            {
                callback(err);
                return;
            }  
            
            if(isEmpty(resultUsuario))
            {
            var queryUser="INSERT INTO [dbo].[USU_Usuarios] ([USU_PrimerNombre] ,[USU_SegundoNombre] ,[USU_PrimerApellido] ,[USU_SegundoApellido] ,[USU_TipoDocumento] ,[USU_NumeroDocumento] ,[USU_Email] ,[USU_NumeroCelular]) VALUES ('"+userFirstName+"' ,'"+userSecondName+"' ,'"+userLastName+"' ,'"+userSecondLastName+"' ,'"+userDocumentType+"' ,'"+userDocumentNumber+"' ,'"+userEmail+"' ,'"+userPhoneNumber+"')";
            dbSQLSec.ExecuteQuery(queryUser,
                (err,result)   =>
                {
                    if(err){
                        callback(err,null);
                        return;
                        
                    }  
                    else {                
                        console.log(result);
                        callback(null,result );  
                    }         
                });
            
            console.log(resultUsuario);
            callback(null,resultUsuario );
            }else{
                console.log(resultUsuario);
                callback(null,resultUsuario );               
            }
                                
        });        
    

}

function querySelectUser(userDocumentNumber,callback){

    var queryUser="select USU_Id from [dbo].[USU_Usuarios] WHERE USU_NumeroDocumento='"+userDocumentNumber+"'";
    dbSQLSec.ExecuteQuery(queryUser,
        (err,usuario)   =>
        {
            if(err){
                callback(err,null);
                return;
                
            }
            if(usuario!=null && usuario[0]!=null)  
                callback(null,usuario[0].USU_Id );
            else
                callback (null,'');
        });

}

function queryCreateCredit(userId, userCalificacion, callback){

    let fecha = Date.now();

    var queryCredit="INSERT INTO [dbo].[CRE_Creditos] ([USU_Id] ,[CRE_Calificacion] ,[CRE_EstadoSolicitud], [CRE_FechaSolicitud]) VALUES ("+userId+" ,'"+userCalificacion+"', 1 , '"+ moment(fecha).format("YYYY-MM-DD HH:mm:ss") +"')";
        dbSQLSec.ExecuteQuery(queryCredit,
            (err,result)   =>
            {
                if(err){
                    callback(err,null);
                    return;
                    
                }  
                else {                
                    console.log(result);
                    callback(null,result );  
                }         
            });

}

function isEmpty(value) {
    return typeof value == 'string' && !value.trim() || typeof value == 'undefined' || value === null;
  }
  