const { useColors } = require('debug/src/browser');
var express = require('express');
const async = require('hbs/lib/async');
var router = express.Router();

var nodemailer = require("nodemailer");

var novedadesModel = require("../modelos/novedadesModel");

/* GET home page. */
router.get('/', async function(req, res, next) {

  var novedades = await novedadesModel.getNovedades()

  res.render('index', {
    novedades
  });
});


router.post('/', async (req, res, next) => {
  var nombre = req.body.nombre;
  var apellido = req.body.apellido;
  var email = req.body.email;
  var mensaje = req.body.mensaje;

  var obj = {
    to: "elisb_89@hotmail.com",
    subject: "Contacto Web",
    html: nombre + " se contactó contigo, su mail es " + email + ". Dejó el siguiente comentario: " + mensaje + "."
  }

  var transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  var info = await transport.sendMail(obj);

  res.render("index", {
    message: "Mensaje enviado.",
  });
});


module.exports = router;