const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  //this unique will make an index to get this attribute faster
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  image: { type: String, required: true },
  // ref is used to tell this will get connected to Place Model's Id
  // type is of objectId of mongoose
  places: [{ type: mongoose.Types.ObjectId, required: true, ref: "Place" }],
});

userSchema.plugin(uniqueValidator);
//there should only be one value for the particular attribute here email should only belongs to one people

//this will make model of the schema.
//New collection(table) will be created of name users
//now we can use model as a class to create document
module.exports = mongoose.model("User", userSchema);
