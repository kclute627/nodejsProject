const mongoose = require('mongoose');
const Review = mongoose.model('Review');
const Store = mongoose.model('Store');


exports.addReview = async (req, res) => {
    req.body.author = req.user._id
    req.body.store = req.params.id
   

    const newReview = new Review(req.body);

    const store = await Store.findOne({_id: req.params.id})

    const storename = store.name

    

    await newReview.save();

    req.flash('success', `Thank you for leaving a review for ${storename}`);
    res.redirect('back')


}