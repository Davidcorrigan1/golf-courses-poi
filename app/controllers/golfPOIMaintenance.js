"use strict";
const Joi = require('@hapi/joi');
const GolfPOI = require("../models/golfPOI");
const User = require("../models/user");
const ImageStore = require("../utils/imageStore");

const GolfPOIMaintenance = {
  home: {
    handler: function (request, h) {
      return h.view("home", { title: "Add a new Course" });
    },
  },
  report: {
    handler: async function (request, h) {
      const golfCourses = await GolfPOI.find().populate("lastUpdatedBy").lean();
      return h.view("report", {
        title: "GolfPOIMaintenance to Date",
        golfCourses: golfCourses,
      });
    },
  },
  addCourse: {
    handler: async function (request, h) {
      try {
        const id = request.auth.credentials.id;
        const user = await User.findById(id);
        const data = request.payload;
        const newCourse = new GolfPOI({
          courseName: data.name,
          courseDesc: data.description,
          lastUpdatedBy: user._id,
        });
        await newCourse.save();
        return h.redirect("/report");
      } catch (err) {
        return h.view("main", {errors: [{message: err.message}]});
      }
    }
  },

  deleteCourse: {
    handler: async function (request, h) {
      const id = request.auth.credentials.id;
      const user = await User.findById(id);
      const courseId = request.params.courseId;

      const deleteCourse = await GolfPOI.findByIdAndDelete(courseId).populate("user").lean();

      return h.redirect("/report");
    },
  },
  addImage: {
    handler: async function (request, h) {
      const id = request.auth.credentials.id;
      const user = await User.findById(id);
      const courseId = request.params.courseId;
      const course = await GolfPOI.findById(courseId).populate("user").lean();

      let courseImages;
      if (course.relatedImages !== undefined && course.relatedImages.length != 0) {
        courseImages = await ImageStore.getCourseImages(course.relatedImages)
      }

      return h.view("gallery", {
        title: "GolfPOIImage Image Update",
        course: course,
        images: courseImages
      });
    },
  },

  uploadFile: {
    handler: async function(request, h) {
      try {
        const file = request.payload.imagefile;
        let updateCourse = await GolfPOI.findById(request.params.id);
        if (Object.keys(file).length > 0) {
          const result = await ImageStore.uploadImage(request.payload.imagefile);
          updateCourse.relatedImages.push(result.public_id);
          let course = await updateCourse.save();

          return h.redirect("/addImage/" + course.id);
        }
        return h.redirect("/addImage/" + updateCourse.id);

      } catch (err) {
        console.log(err);
      }
    },
    payload: {
      multipart: true,
      output: 'data',
      maxBytes: 209715200,
      parse: true
    }
  },
  deleteImage: {
    handler: async function(request, h) {
      try {
        await ImageStore.deleteImage(request.params.id);
        const updateCourse = await GolfPOI.findById(request.params.courseId).populate("user").lean();
        const allImages = await ImageStore.getAllImages();

        return h.redirect("/addImage/" + updateCourse.id);

      } catch (err) {
        console.log(err);
      }
    }
  },
  course: {
    handler: async function(request, h) {
      const id = request.auth.credentials.id;
      const user = await User.findById(id);
      const courseId = request.params.courseId;
      const course = await GolfPOI.findById(courseId).populate("user").lean();

      let courseImages;
      if (course.relatedImages !== undefined && course.relatedImages.length != 0) {
        courseImages = await ImageStore.getCourseImages(course.relatedImages)
      }

      return h.view("course", {
        title: "GolfPOIImage Image Update",
        course: course,
        images: courseImages
      });
    }
  },
  updateCourse: {
    validate: {
      payload: {
        courseName: Joi.string().required(),
        courseDesc: Joi.string().required(),
      },
      options: {
        abortEarly: false,
      },
      failAction: function (request, h, error) {
        return h
          .view("course", {
            title: "Course update error",
            errors: error.details,
          })
          .takeover()
          .code(400);
      },
    },
    handler: async function(request, h) {
      try {
        const courseEdit = request.payload;
        const id = request.auth.credentials.id;
        const user = await User.findById(id);
        const courseId = request.params.courseId;
        const course = await GolfPOI.findById(courseId);

        course.courseName = courseEdit.courseName;
        course.courseDesc = courseEdit.courseDesc;
        course.lastUpdatedBy = user._id;
        await course.save();
        return h.redirect("/report");
      } catch (err) {
        return h.view("main", {errors: [{message: err.message}]});
      }
    }
  }
};

module.exports = GolfPOIMaintenance;
