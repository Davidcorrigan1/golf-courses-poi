"use strict";
const Joi = require('@hapi/joi');
const GolfPOI = require("../models/golfPOI");
const User = require("../models/user");
const LocationCategory = require("../models/locationCategory");
const ImageStore = require("../utils/imageStore");

const GolfPOIMaintenance = {
  //----------------------------------------------------------------------------------------
  // This method will retrieve the list of location categories and pass these to the
  // 'newCourse' view. This view allows the user to add a new POI Golf course.
  //----------------------------------------------------------------------------------------
  newCourse: {
    handler: async function (request, h) {
      const categories = await LocationCategory.find().populate("lastUpdatedBy").lean();
      return h.view("newCourse", { title: "Add a new Course" , categories: categories});
    },
  },

  //----------------------------------------------------------------------------------------
  // This method will retrieve all the current courses from the GolfPOI collection. And it will
  // pass these to the 'report' view to display them.
  //----------------------------------------------------------------------------------------
  report: {
    handler: async function (request, h) {
      const golfCourses = await GolfPOI.find().populate("lastUpdatedBy").populate("category").lean();
      return h.view("report", {
        title: "GolfPOIMaintenance to Date",
        golfCourses: golfCourses,
      });
    },
  },

  //----------------------------------------------------------------------------------------
  // This method is called from the 'newCourse' view within the 'addCourse' partial which
  // the user uses to add a new course. It is passed in courseName, courseDesc and province
  // which are validated.
  // If there are all present, the following is carried out.
  // (1) Authenticate the user and retrieve the user data from collection
  // (2) retrieve the payload data and check the province against the collection to validate
  // (3) Create a new course object using the passed in data.
  // (4) Save the new course document to the collection and redirect to the 'report' view.
  //----------------------------------------------------------------------------------------
  addCourse: {
    validate: {
      payload: {
        courseName: Joi.string().required(),
        courseDesc: Joi.string().required(),
        province: Joi.string().required()
      },
      options: {
        abortEarly: false,
      },
      failAction: function (request, h, error) {
        return h
          .view("home", {
            title: "Course update error",
            errors: error.details,
          })
          .takeover()
          .code(400);
      },
    },
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

  //----------------------------------------------------------------------------------------
  // This method is called from the 'report' view within the 'course-list' partial by
  // pressing the delete button opposite a course.
  // It firstly authenticates the user and retrieves the user details from the collection.
  // It then deletes the course from the GolfPOI collection by courseId and redirects
  // to the 'report' view.
  //----------------------------------------------------------------------------------------
  deleteCourse: {
    handler: async function (request, h) {
      const id = request.auth.credentials.id;
      const user = await User.findById(id);
      const courseId = request.params.courseId;

      const deleteCourse = await GolfPOI.findByIdAndDelete(courseId).populate("user").lean();

      return h.redirect("/report");
    },
  },

  //----------------------------------------------------------------------------------------
  // This method
  //----------------------------------------------------------------------------------------
  addImage: {
    handler: async function (request, h) {
      const id = request.auth.credentials.id;
      const user = await User.findById(id);
      const courseId = request.params.courseId;
      const course = await GolfPOI.findById(courseId).populate("lastUpdatedBy").populate("category").lean();

      let courseImages;
      if (course.relatedImages !== undefined && course.relatedImages.length != 0) {
        courseImages = await ImageStore.getCourseImages(course.relatedImages)
      }

      for(let i=0; i < courseImages.length; i++){
        courseImages[i].courseId = courseId;
      }

      return h.view("addImage", {
        title: "GolfPOIImage Image Update",
        course: course,
        images: courseImages
      });
    },
  },

  //----------------------------------------------------------------------------------------------
  // This method will handle the uploading of an image from the upload partial form. It receives the
  // image in the payload and the course id in the param. It checks the an actual image is passed.
  // It uploads the image to Cloudinary and uses the public id of the result to update in the
  // array of ids in the relatedImages. It then saves the course document to the golfPOI collection.
  // And finally redirects to the addImage view.
  //----------------------------------------------------------------------------------------------
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

  //----------------------------------------------------------------------------------------------
  // This method
  //----------------------------------------------------------------------------------------------
  deleteImage: {
    handler: async function(request, h) {
      try {
        await ImageStore.deleteImage(request.params.id);
        const courseId = request.params.courseId;
        const updateCourse = await GolfPOI.findById(courseId).populate("lastUpdatedBy").populate("category");
        const allImages = await ImageStore.getAllImages();

        return h.redirect("/addImage/" + courseId);

      } catch (err) {
        console.log(err);
      }
    }
  },

  //----------------------------------------------------------------------------------------------
  // This method will
  //----------------------------------------------------------------------------------------------
  course: {
    handler: async function(request, h) {
      const id = request.auth.credentials.id;
      const user = await User.findById(id);
      const courseId = request.params.courseId;
      const course = await GolfPOI.findById(courseId).populate("user").populate("locationCategory").lean();

      let courseImages;
      if (course.relatedImages !== undefined && course.relatedImages.length != 0) {
        courseImages = await ImageStore.getCourseImages(course.relatedImages)
      }

      // Adding the courseId to the array of images so it's available in the partial
      for(let i=0; i < courseImages.length; i++){
        courseImages[i].courseId = courseId;
      }

      const categories = await LocationCategory.find().populate("lastUpdatedBy").lean();
      const currentCategory = course.category.province;

      return h.view("course", {
        title: "GolfPOIImage Image Update",
        course: course,
        images: courseImages,
        categories: categories,
        currentCategory: currentCategory
      });
    }
  },

  //----------------------------------------------------------------------------------------------
  // This method will
  //----------------------------------------------------------------------------------------------
  updateCourse: {
    validate: {
      payload: {
        courseName: Joi.string().required(),
        courseDesc: Joi.string().required(),
        province: Joi.string().required()
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
        const course = await GolfPOI.findById(courseId).populate("lastUpdatedBy").populate("category");

        if (course.category.province != courseEdit.province) {
          let category = await  LocationCategory.findByProvince(courseEdit.province);
          course.category = category.id;
        }
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

  //----------------------------------------------------------------------------------------------
  // This method will
  //----------------------------------------------------------------------------------------------
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

  //----------------------------------------------------------------------------------------------
  // This method will
  //----------------------------------------------------------------------------------------------
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
        return h.view("category", {errors: [{message: err.message}]});
      }
    }
  },

  //----------------------------------------------------------------------------------------------
  // This method is called from the 'category' view within the 'category-list' partial by
  // pressing the delete button opposite the category to be deleted.
  // It will firstly authenticate the user and retrieve the user data from the collection.
  // It will then find and delete the category data from the LocationCategory collection using the
  // category id passed in as a param. It will then redirect to the 'category' view.
  //----------------------------------------------------------------------------------------------
  deleteCategory: {
    handler: async function (request, h) {
      try {
        const id = request.auth.credentials.id;
        const user = await User.findById(id);
        const categoryId = request.params.categoryId;

        const deleteCategory = await LocationCategory.findByIdAndDelete(categoryId).populate("user").lean();

        return h.redirect("/category");
      } catch (err) {
        return h.view("category", {errors: [{message: err.message}]});
      }
    },
  },
};

module.exports = GolfPOIMaintenance;
