const mongoose = require('mongoose');
mongoose.Promise =  global.Promise;


const reviewSchema = new mongoose.Schema({

    created: {
        type: Date,
        default: Date.now
    },
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'You Must Supply an Author'


    },

    store: {
        type: mongoose.Schema.ObjectId,
        ref: 'Store',
        required: 'You Must Supply a Store'

    },

    text: {
        type: String,
        required: "Your Review Must Have Text"
    },
    rating:{
        type: Number,
        min: 1,
        max: 5, 

    }

});

function autoPopulate(next) {
    this.populate('author')
    next()
    
}

reviewSchema.pre('find', autoPopulate);
reviewSchema.pre('findOne', autoPopulate )


module.exports = mongoose.model('Review', reviewSchema)