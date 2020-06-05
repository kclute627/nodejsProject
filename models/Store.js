const mongoose = require("mongoose");

mongoose.Promise = global.Promise;

const slug = require("slugs");

// Making our SCHEMA

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: "Please enter a store Name",
  },
  slug: String,
  description: {
    type: String,
    trim: true,
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      default: 'Point'

    },
    coordinates: [{
      type: Number,
      required: 'You must supply coordinates'
    }],
    address:{
      type: String,
      required: 'You Must Supply An Address'
    }
  },
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You Must Supply an Author'
  },
  
  
  });

//Define Indexes 
storeSchema.index({
  name: 'text',
  description: 'text',
  
})
storeSchema.index({
  location: '2dsphere'
})

storeSchema.pre("save", async function (next) {
  if (!this.isModified("name")) {
    next();
    return;
  }
  this.slug = slug(this.name);

  // find other stores with the same slug 

  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');

  const storesWithSlug = await this.constructor.find({slug: slugRegEx})

  if (storesWithSlug.length){
    this.slug= `${this.slug}-${storesWithSlug.length + 1}`
  }

  next(); 

 
}); 

storeSchema.statics.getTagsList = function(){
  return this.aggregate([
    { $unwind: '$tags'},
    { $group: {_id: '$tags', count: {$sum: 1 } }},
    { $sort: {count: -1}}
  ])
}

storeSchema.statics.getTopStores = function(){


  return this.aggregate([

    // look up stores and populate their reviews
    {$lookup: 
    {from: 'reviews', localField: '_id', foreignField: 'store', as: 'reviews'}
    },

    // filter stores with 2 or more reviews 
    {
      $match: {
        'reviews.1': {$exists: true}
      }
    },

    // make avg reviews 
    {
      $addFields: {
        averageRating: {$avg: '$reviews.rating' }
      }
    },
    // sort highest reviews on to 
    {
      $sort: { averageRating: -1},

    },
    {$limit: 10 }

    // limit to 10 results



  ])
}

storeSchema.virtual('reviews', {
  ref: 'Review',
  localField: "_id",
  foreignField: 'store'  
})

function autoPopulate(next){
  this.populate('reviews')
  next()
}

storeSchema.pre('find', autoPopulate)
storeSchema.pre('findOne', autoPopulate)



module.exports = mongoose.model("Store", storeSchema);
