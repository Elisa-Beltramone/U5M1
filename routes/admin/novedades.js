var express = require('express');
const pool = require('../../modelos/bd');
var router = express.Router();
var novedadesModel = require("../../modelos/novedadesModel");
var util = require("util");
var cloudinary = require("cloudinary").v2;

var uploader = util.promisify(cloudinary.uploader.upload);
const destroy = util.promisify(cloudinary.uploader.destroy);


/* GET home page. */
router.get('/', async function (req, res, next) {

  var novedades = await novedadesModel.getNovedades();

  novedades = novedades.map(novedad => {
    if (novedad.imgid) {
      const imagen = cloudinary.image(novedad.imgid, {
        width: 80,
        height: 80,
        crop: "fill"
      });
      return {
        ...novedad,
        imagen
      }
    } else {
        return {
          ...novedad,
          imagen: ""
        }
      }
  });


  res.render('admin/novedades', {
    layout: "admin/layout",
    usuario: req.session.nombre,
    novedades
  });
});

router.get("/eliminar/:id", async (req, res, next) => {
  var id = req.params.id;

  let novedad = await novedadesModel.getNovedadById(id);
  if (novedad.imgid) {
    await (destroy(novedad.imgid));
  }

  await novedadesModel.deleteNovedadesById(id);
  res.redirect("/admin/novedades")
});

router.get("/agregar", (req, res, next) => {
  res.render("admin/agregar", {
    layout: "admin/layout"
  })
});

router.post("/agregar", async (req, res, next) => {
  try {
    var imgid = "";
    if (req.files && Object.keys(req.files).length > 0) {
      imagen = req.files.imagen;
      imgid = (await uploader(imagen.tempFilePath)).public_id;
    }
    if (req.body.titulo != "" && req.body.subtitulo != "" && req.body.cuerpo != "") {
      await novedadesModel.insertNovedad({
        ...req.body,
        imgid
      });
      res.redirect("/admin/novedades")
    } else {
      res.render("admin/agregar", {
        layout: "admin/layout",
        error: true,
        message: "Todos los campos son requeridos"
      })
    }
  } catch (error) {
    console.log(error)
    res.render("admin/agregar", {
      layout: "admin/layout",
      error: true,
      message: "No se cargó la novedad"
    })
  }
})

router.get("/modificar/:id", async (req, res, next) => {
  var id = req.params.id;
  var novedad = await novedadesModel.getNovedadById(id);
  res.render("admin/modificar", {
    layout: "admin/layout",
    novedad
  });
});

router.post("/modificar", async (req, res, next) => {
  try {
    let imgid = req.body.original;
    let borrar_img_vieja = false;
    if (req.body.img_delete === "1") {
      imgid = null;
      borrar_img_vieja = true;
    } else {
      if (req.files && Object.keys(req.files).length > 0) {
        imagen = req.files.imagen;
        imgid =  (await uploader(imagen.tempFilePath)).public_id;
        borrar_img_vieja = true;
      }
    }
    if (borrar_img_vieja && req.body.img_original) {
      await (destroy(req.body.img_original));
    }

    var obj = {
      titulo: req.body.titulo,
      subtitulo: req.body.subtitulo,
      cuerpo: req.body.cuerpo,
      imgid
    }
    console.log(obj)
    await novedadesModel.modificarNovedadById(obj, req.body.id);
    res.redirect("/admin/novedades");
  } catch (error) {
    res.render("admin/modificar", {
      layout: "admin/layout",
      error: true,
      message: "No se modificó la novedad"
    })
  }
});

module.exports = router;