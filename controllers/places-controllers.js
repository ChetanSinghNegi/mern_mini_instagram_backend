const HttpError = require("../models/http-error");
const fs = require("fs");
const { validationResult } = require("express-validator");
const getCoordsForAddress = require("../util/location");
const Place = require("../models/place");
const mongoose = require("mongoose");
const User = require("../models/user");

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid; //{pid:'p1'}

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Fetching places failed. Please try again later",
      500
    );
    return next(error);
  }
  if (!place) {
    const error = new HttpError(
      "Could not find a place for the provided id.",
      404
    );
    // this works if above code is synchronous
    // throw new HttpError("Could not find a place for the provided id.", 404);
    return next(error);
  }

  // returned object from place.findById is not js object
  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  // let places;  I am using alternate approach but this approach works fine too.
  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate("places"); //we will get array . If we will not use mongoose then we will get cursor. As to lighten up processing here
  } catch (err) {
    const error = new HttpError(
      "Fetching places failed. Please try again later",
      500
    );
    return next(error);
  }
  // if (!places || places.length === 0) {
  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    //     Using next(): If you have any middleware function and below the next() you have some lines or function that you want to execute, then by using next() you can actually execute the lines or function because it runs the code below next() after all middleware function finished.

    // Using return next(): If you have any middleware function and below the return next() you have some lines that you want to execute, then the lines which are below return next() won’t be executed because it will jump out the callback immediately and the code below return next() in the callback will be unreachable.
    return next(
      new HttpError("Could not find places for the provided user id.", 404)
    );
  }

  res.json({
    places: userWithPlaces.places.map((place) =>
      place.toObject({ getters: true })
    ), //cannot use direct places.toObject() as places is array not single value.
  });
};

const createPlace = async (req, res, next) => {
  const { title, description, address } = req.body;
  const errors = validationResult(req); //this for the validation given by express-validation external library
  if (!errors.isEmpty()) {
    console.log("errorrs => ", errors);
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  // const title = req.body.title;
  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.path,
    creator: req.userData.userId,
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError("Finding User failed, please try again.", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id", 404);
    return next(error);
  }

  // console.log(user);
  try {
    // Transaction is required because two task is related to each other. If one of them failed so both should not be commited into the database
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace); //this will push only Id
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Creating place failed, please try again.",
      500
    );
    return next(error);
  }

  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req); //this for the validation given by express-validation external library
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }
  const placeId = req.params.pid; //comes in url
  const { title: newTitle, description: newDescription } = req.body; //comes with request body
  let place;

  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update place.",
      500
    );
    return next(error);
  }

  if (place.creator.toString() !== req.userData.userId) {
    const error = new HttpError("You are not allowed to edit this place", 401);
    return next(error);
  }
  place.title = newTitle;
  place.description = newDescription;
  try {
    await place.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update place.",
      500
    );
    return next(error);
  }
  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    //populate will give info of collections linked(ref in schema attribute) with creator
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    // this works if above code is synchronous
    // throw new HttpError("Could not find a place for the provided id.", 404);
    const error = new HttpError(
      "Something went wrong, could not delete place.",
      500
    );
    return next(error);
  }
  if (!place) {
    const error = new HttpError("Could not find place for this id.", 404);
    return next(error);
  }

  if (place.creator.id !== req.userData.userId) {
    const error = new HttpError("You are not allowed to edit this place", 401);
    return next(error);
  }

  const imagePath = place.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await Place.findByIdAndDelete(placeId, { session: sess }); //deleting in places collection
    place.creator.places.pull(place); //deleting inside users collection
    await place.creator.save({ session: sess }); //user matched is saved
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete place.",
      500
    );
    return next(error);
  }

  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  res.status(200).json({ message: "Deleted place." });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
