const express = require("express");
const router = express.Router();
const storeControler = require("../controllers/storeController");
const userController = require('../controllers/userController'); 
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');

const { catchErrors } = require("../handlers/errorHandlers");

// Do work here
router.get("/", catchErrors(storeControler.getStores));
router.get("/stores", catchErrors(storeControler.getStores)); 
router.get("/stores/page/:page", catchErrors(storeControler.getStores));     
router.get("/add",  
authController.isLoggedIn,
storeControler.addStore);

router.post("/add", 
storeControler.upload,
catchErrors(storeControler.resize),
catchErrors(storeControler.createStore)
);

router.post("/add/:id", 
storeControler.upload,
catchErrors(storeControler.resize),
catchErrors(storeControler.updateStore));

router.get('/stores/:id/edit', catchErrors(storeControler.editStore));

router.get('/store/:name', catchErrors(storeControler.storeName));

router.get('/tags', catchErrors(storeControler.getStoresByTag));

router.get('/tags/:tags', catchErrors(storeControler.getStoresByTag)); 


router.get('/login', userController.loginForm);

router.get('/register', userController.registerForm);

//1. Validate the user
//2. register the user 
//3. we need to log them in


router.post('/register',
    userController.validateRegister,
    userController.register,
    authController.login,

);

router.get('/logout', authController.logout)

router.post('/login', authController.login);


router.get('/account',
 authController.isLoggedIn,
 userController.account)

router.post('/account', catchErrors(userController.accountUpdates))

router.post('/account/forgot', catchErrors(
    authController.forgot
))

router.get('/account/reset/:token', catchErrors(
    authController.reset  
))

router.post('/account/reset/:token', 
authController.confirmPasswords, 
catchErrors(authController.update))


router.get('/map', storeControler.mapPage);

router.get('/hearts', catchErrors(storeControler.heartPage))

router.post('/reviews/:id', 
authController.isLoggedIn,
catchErrors(reviewController.addReview))


router.get('/top', catchErrors(storeControler.getTopStores))


//API /////

router.get('/api/search', catchErrors(storeControler.searchStores));


router.get('/api/stores/near', catchErrors(storeControler.mapStores))


router.post('/api/stores/:id/hearts', authController.isLoggedIn, catchErrors(storeControler.heartStore) )



module.exports = router;
