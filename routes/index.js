//'use strict';
var express = require('express');
const parkController = require('../syncpark/parkcontroller');
const usercontroller= require('../User/UserController');
var router = express.Router();

/*
 * Routes that can be accessed only by autheticated users
 * API Routes 
 */
//get
router.get('/index', (req,res)=>{return  res.status(200).jsonp({mensaje:"Fecurty API Rest working...."});});

//Get all Transactions by user: should sent iduser in body post
//router.post('/api/insertUser', usercontroller.insertUser);

//Get all Transactions by user: should sent iduser in body post
//router.post('/api/login', usercontroller.login);


//router.post('/api/auth/getAllUsers', usercontroller.getAllUsers);
// router.post('/api/SincronizarInformacionMovil', parkController.DescargarInformacionSincronizacion);

// router.post('/api/GuardarImagen', parkController.GuardarImagen);

// router.post('/api/ConsultarEsquemaDB', parkController.ConsultarEsquemaDB);

router.post('/api/ConsultarCentralRiesgos', parkController.ConsultarCentralRiesgos);

router.post('/api/RegistrarCreditoUsuario', parkController.RegistrarCreditoUsuario);

module.exports = router;
