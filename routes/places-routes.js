const express = require("express");
const placesControllers = require("../controllers/places-controllers");
const router = express.Router();
const { check } = require("express-validator");
const fileUpload = require("../middleware/file-upload");
const checkAuth = require("../middleware/check-auth");

//the routes will run from top to button with the help of either next or function end

//this is the exact path where the url should end. This should the endpoint
router.get("/:pid", placesControllers.getPlaceById);

router.get("/user/:uid", placesControllers.getPlacesByUserId);

// this route will protects the upcoming routes with token authentication
router.use(checkAuth);

// protected route with token authentication
router.patch(
  "/:pid",
  [check("title").notEmpty(), check("description").isLength({ min: 5 })],
  placesControllers.updatePlace
);

// protected route with token authentication
router.delete("/:pid", placesControllers.deletePlace);

// protected route with token authentication
// check(parameter to check in a body of req).notEmpty()
router.post(
  "/",
  fileUpload.single("image"),
  [
    check("title").notEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").notEmpty(),
  ],
  placesControllers.createPlace
);

module.exports = router;
