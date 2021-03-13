"use strict";

const Joi = require('@hapi/joi');
const GolfPOI = require("../models/golfPOI");
const User = require("../models/user");
const LocationCategory = require("../models/locationCategory");
const ImageStore = require("../utils/imageStore");
const Boom = require("@hapi/boom");

const AdminFunction = {
  //----------------------------------------------------------------------------------------
  // This method will retrieve the list of location categories and pass these to the
  // 'newCourse' view. This view allows the user to add a new POI Golf course.
  //----------------------------------------------------------------------------------------
  manageUsers: {
    handler: async function(request, h) {
      const id = request.auth.credentials.id;
      const user = await User.findById(id);


      let userArray = [];

      if (user.adminUser) {
        const allUsers = await User.find().lean();
        for (let i=1; i < allUsers.length; i++) {
          if (!allUsers[i].adminUser) {
            userArray.push(allUsers[i]);
          }
        }
        const adminUser = user.adminUser;

        return h.view("manageUsers", {
            title: "Manage User Accounts",
            userArray: userArray,
            adminUser: adminUser,
        });
      } else {
        const message = "User is not Authorised";
        throw Boom.unauthorized(message);
      };

    },
  }
};

module.exports = AdminFunction;