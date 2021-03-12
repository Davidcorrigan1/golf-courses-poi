"use strict";
const Joi = require('@hapi/joi');
const GolfPOI = require("../models/golfPOI");
const User = require("../models/user");
const LocationCategory = require("../models/locationCategory");
const ImageStore = require("../utils/imageStore");

const GolfPOIMaintenance = {
  home: {
    handler: async function (request, h) {
      const categories = await LocationCategory.find().populate("lastUpdatedBy").lean();
      return h.view("home", { title: "Add a new Course" , categories: categories});
    },
  },
  report: {
    handler: async function (request, h) {
      const golfCourses = await GolfPOI.find().populate("lastUpdatedBy").populate("category").lean();
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
        const category = await LocationCategory.findByProvince(data.province);
        const newCourse = new GolfPOI({
          courseName: data.name,
          courseDesc: data.description,
          lastUpdatedBy: user._id,
          category: category._id,
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

      return h.view("addImage", {
        title: "GolfPOIImage Image Update",
        course: course,
        images: courseImages
      });
    },
  },
  // This method will handle the uploading of an image from the upload partial form. It receives the
  // image in the payload and the course id in the param. It checks the an actual image is passed.
  // It uploads the image to Cloudinary and uses the public id of the result to update in the
  // array of ids in the relatedImages. It then saves the course document to the golfPOI collection.
  // And finally redirects to the addImage view.
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
  },
  showCategory: {
    handler: async function(request, h) {
      try {
        const id = request.auth.credentials.id;
        const user = await User.findById(id).lean();
        const categories = await LocationCategory.find().populate("lastUpdatedBy").lean();
        return h.view("category", { title: "Adding Categories", categories: categories, user: user });
      } catch (err) {
        return h.redirect("/report");
      }
    }
  },
  updateCategory: {
    handler: async function (request, h) {
      try {
        const id = request.auth.credentials.id;
        const user = await User.findById(id);
        const data = request.payload;
        const validCountiesArray = data.validCounties.split(' ');
        const newCategory = new LocationCategory({
          province: data.province,
          validCounties: validCountiesArray,
          lastUpdatedBy: user._id,
        });
        await newCategory.save();
        return h.redirect("/category");
      } catch (err) {
        return h.view("main", {errors: [{message: err.message}]});
      }
    }
  },
  deleteCategory: {
    handler: async function (request, h) {
      const id = request.auth.credentials.id;
      const user = await User.findById(id);
      const categoryId = request.params.categoryId;

      const deleteCategory = await LocationCategory.findByIdAndDelete(categoryId).populate("user").lean();

      return h.redirect("/category");
    },
  },
};

module.exports = GolfPOIMaintenance;
