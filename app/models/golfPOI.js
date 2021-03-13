"use strict";

const Mongoose = require("mongoose");
const Schema = Mongoose.Schema;

const golfPOISchema = new Schema({
  courseName: String,
  courseDesc: String,
  lastUpdatedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: "LocationCategory",
  },
  relatedImages: [],
});

golfPOISchema.statics.findById = function(id) {
  return this.findOne({ _id : id});
};

module.exports = Mongoose.model("GolfPOI", golfPOISchema);
