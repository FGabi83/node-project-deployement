const mongoose = require('mongoose'); //mongoose package to interface with MongoDB
mongoose.Promise = global.Promise; //built in ES6 promise, set the mongoose promise property to global
const slug = require('slugs'); //package to create url friendly slugs

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true, // removes white space
    required: 'Please enter a store name!' // true or error message
  },
  slug: String,
  description: {
    type: String,
    trim: true
  }, 
  tags: [String],
  created: {
    type: Date,
    default: Date.now()
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [{
      type: Number,
      required: 'You must supply coordinates!'
    }],
    address: {
      type: String,
      required: 'You must supply an address!'
    }
  }, 
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author'
  }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
  
  // Define our indexes

storeSchema.index({
  name: 'text',
  description: 'text'
});

storeSchema.index({ location: '2dsphere' });

// pre-save hook in MongoDB
storeSchema.pre('save', async function(next) {
    if(!this.isModified('name')) {
        next(); // skip it
        return; // stop this function from running
    }
    this.slug = slug(this.name);
    // find other stores that have a slug of wes, wes-1, wes-2, etc.
    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`,'i');
    const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
    if(storesWithSlug.length) {
      this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
    }
    next();
    
});

// static methods are methods that are run on the model
storeSchema.statics.getTagsList = function() {
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 }  }},
    { $sort: { count: -1 }}
  ]);
};

storeSchema.statics.getTopStores = function() {
  return this.aggregate([
    // Lookup stores and populate their reviews
    { $lookup: { 
      from: 'reviews', 
      localField: '_id', 
      foreignField: 'store', 
      as: 'reviews' } 
    },
    // filter for only items that have 2 or more reviews
    { $match: { 'reviews.1': { $exists: true } } }, // match documents where the second item of the array exists
    // add the average reviews field
    { $set: { // alias for $addFields
      averageRating: { $avg: '$reviews.rating' }
    } },
    // sort it by our new field, highest reviews first
    { $sort: { averageRating: -1 }},
    // limit to at most 10
    { $limit: 10 } 
  ]);
};


// find reviews where the stores _id property === reviews store property
storeSchema.virtual('reviews', {
  ref: 'Review', // what model to link?
  localField: '_id', // which field on the store?
  foreignField: 'store' // which field on the review?

});

function autopopulate(next) {
  this.populate('reviews');
  next();
}

storeSchema.pre('find', autopopulate); //pre-find hook
storeSchema.pre('findOne', autopopulate); //pre-findOne hook

module.exports = mongoose.model('Store', storeSchema);