const mongoose = require("mongoose");
const Store = mongoose.model("Store");
const User = mongoose.model("User");
const multer = require("multer");
const jimp = require("jimp");
const uuid = require("uuid");

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith("image/");
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: `That File Type isn't allower` }, false);
    }
  },
};

exports.homePage = (req, res) => {
  console.log(req.name);

  res.render("index");
};

exports.addStore = (req, res) => {
  res.render("editStore", { title: "Add Store" });
};

exports.upload = multer(multerOptions).single("photo");

exports.resize = async (req, res, next) => {
  // check if there is no new file
  if (!req.file) {
    next();
    return;
  }

  const ext = req.file.mimetype.split("/")[1];

  req.body.photo = `${uuid.v4()}.${ext}`;

  // now we resize

  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);

  await photo.write(`./public/uploads/${req.body.photo}`);

  next();
};

exports.createStore = async (req, res) => {
  req.body.author = req.user._id;
  const store = await new Store(req.body).save();
  await store.save();
  req.flash(
    "success",
    `Successfully Created ${store.name}. Care to leave a review?`
  );

  res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
  // 1. get all stores on database

  const page = req.params.page || 1;

  const limit = 4;

  const skip = page * limit - limit;

  const storesPromise = Store.find().skip(skip).limit(limit).sort({created: 'desc'});

  const countPromise = Store.count();

  const [stores, count] = await Promise.all([storesPromise, countPromise]);

  // console.log(stores)

  const pages = Math.ceil(count / limit);
  if (!stores.length && skip) {
    req.flash("info", "Hey Do not do that");
    res.redirect(`/stores/page/${pages}`);
    return;
  }
  res.render("stores", { title: "Stores", stores, count, pages, page });
};

const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) {
    throw Error("You Must own the store to make edits");
  }
};

exports.editStore = async (req, res) => {
  // find store

  const store = await Store.findOne({ _id: req.params.id });

  // confirm they are the owner of the store
  confirmOwner(store, req.user);

  // render out the edit form
  res.render("editStore", { title: `Edit ${store.name}`, store });
};

exports.updateStore = async (req, res) => {
  // set location data to be a point

  req.body.location.type = "Point";

  // find and update store

  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // return the new store instead of the old one
    runValidators: true,
  }).exec();

  req.flash(
    "success",
    `Sucessfully Updated <strong>${store.name}</strong> <a href='/stores/${store.slug}'>View Store</a>`
  );

  res.redirect(`/stores/${store._id}/edit`);

  // redirect and tell them it worked
};

exports.storeName = async (req, res, next) => {
  // 1. find the store that was clicked on

  //   res.json(req.params)
  const store = await Store.findOne({ slug: req.params.name }).populate(
    "author reviews"
  );

  if (!store) return next();

  res.render("storePage", { store, title: store.name });
};

exports.getStoresByTag = async (req, res) => {
  const tag = req.params.tags;
  const tagQuery = tag || { $exists: true };
  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({ tags: tagQuery });

  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);

  res.render("tag", { tags, title: "TAGS", tag, stores });
};

exports.searchStores = async (req, res) => {
  const stores = await Store.find(
    {
      $text: {
        $search: req.query.q,
      },
    },
    {
      score: { $meta: "textScore" },
    }
  )
    .sort({
      score: { $meta: "textScore" },
    })
    // limit to only 5 results
    .limit(5);

  res.json(stores);
};

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);

  const q = {
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates,
        },
        $maxDistance: 20000,
      },
    },
  };

  const stores = await Store.find(q)
    .select("photo name slug description location ")
    .limit(10);

  res.json(stores);
};

exports.mapPage = (req, res) => {
  res.render("map", { title: "Map" });
};

exports.heartStore = async (req, res) => {
  const hearts = req.user.hearts.map((obj) => obj.toString());

  const opp = hearts.includes(req.params.id) ? "$pull" : "$addToSet";

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { [opp]: { hearts: req.params.id } },
    { new: true }
  );

  User.findOneAndUpdate();

  res.json(user);
};

exports.heartPage = async (req, res) => {
  const stores = await Store.find({
    _id: { $in: req.user.hearts },
  });
  // res.json(stores)

  res.render("stores", { title: "My Fav's", stores });
};

exports.getTopStores = async (req, res) => {
  const stores = await Store.getTopStores();

  res.render("top", { stores, title: "Top Stores" });
};
