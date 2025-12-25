const { Language, validate } = require("../modal/Language");

const tryCatchHandler = require("../utils/tryCatch");



////////////////////////////////////////////////////////
/////// ************ ADD NEW LANGUAGE **********///////
//////////////////////////////////////////////////////
exports.addLanguage = tryCatchHandler(async (req, res, next) => {
  const { error } = validate(req.body);

  if (error) {
    return res.status(400).json({ success: 1, error: error.details[0].message});
  }

  ///// find lang if it is already exist //////
  let findLang = await Language.findOne({ language_name: req.body.language_name })

  if (findLang !== null) {
    return res.status(400).json({ success: 1, error: "This language is already exist"});
  }

  const lang = await Language.create(req.body);

  return res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Language created successfully",
    data: lang,
  });
});
/////////////////////////////////////////////////////



////////////////////////////////////////////////////////
/////// ************ GET ALL LANGUAGE **********///////
//////////////////////////////////////////////////////
exports.getAllLanguage = tryCatchHandler(async (req, res, next) => {

  const lang = await Language.find();

  return res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Language list get successfully",
    data: lang,
    total: lang.length,
  });
});
/////////////////////////////////////////////////////



///////////////////////////////////////////////////////////
/////// ************ GET SINGLE LANGUAGE **********///////
/////////////////////////////////////////////////////////
exports.getSingleLanguage = tryCatchHandler(async (req, res, next) => {

  const lang = await Language.findOne({ _id: req.params.id });

  return res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Language get successfully",
    data: lang,
  });
});
/////////////////////////////////////////////////////////



//////////////////////////////////////////////////////////////
/////// ************ UPDATE DEFAULT LANGUAGE **********//////
////////////////////////////////////////////////////////////
exports.updateDefaultLanguage = tryCatchHandler(async (req, res, next) => {

  await Language.findOneAndUpdate(
    { _id: req.params.id },
    { is_default: req.body.is_default },
    {
      new: true,
    }
  );

  return res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Language updated successfully",

  });
});
/////////////////////////////////////////////////////



//////////////////////////////////////////////////////////////
/////// ************ UPDATE STATUS LANGUAGE **********///////
////////////////////////////////////////////////////////////
exports.updateStatusLanguage = tryCatchHandler(async (req, res, next) => {

  await Language.findOneAndUpdate(
    { _id: req.params.id },
    { status: req.body.status },
    {
      runValidators: true,
    }
  );

  return res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Language updated successfully",

  });
});
/////////////////////////////////////////////////////


