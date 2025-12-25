const express = require("express");
const { addLanguage, getAllLanguage, getSingleLanguage, updateStatusLanguage, updateDefaultLanguage} = require("../controllers/languageControllers");
const router = express.Router();

////// **** ADD,GET  LANGUAGE **** //////
router.post("/", addLanguage).get("/", getAllLanguage);

////// **** GET BY ID **** //////
router.get("/:id", getSingleLanguage);

////// **** UPDATE DEFAULT LANGUAGE **** //////
router.post("/is-default/:id", updateDefaultLanguage);

////// **** UPDATE STATUS LANGUAGE **** //////
router.post("/status/:id", updateStatusLanguage);


module.exports = router;