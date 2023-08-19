const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// this is the schema/blueprint of the collection.
const placeSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  address: { type: String, required: true },
  location: {
    lat: { type: String, required: true },
    lng: { type: String, required: true },
  },
  // ref is used to tell this will get connected to User Model's Id
  // type is of objectId of mongoose
  creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
});

//this will make model of the schema.
//New collection(table) will be created of name places
//now we can use model as a class to create document
module.exports = mongoose.model("Place", placeSchema);
