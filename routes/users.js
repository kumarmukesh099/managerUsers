const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const User = require('../models/User');

//Create user
router.post('/', [
    check('name', 'Name is required').notEmpty(),
    check('email', 'Please enter a valid email Id').isEmail(),
    check('mobile', 'Mobile number is required').isMobilePhone("any")
], async (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(404).json({ errors: errors.array() });
    }

    let { name, email, mobile, address } = req.body;
    let { street, locality, city, pincode, location } = address;
    if (!location) { location = {}; }
    location.type = location.type || "Point";
    location.coordinates = location.coordinates || [-73.88, 40.78 ]; //added the default one if not exist
                                                                     
    let userResponse;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(404).json({ msg: 'User already exist' });
        }
        user = new User({   //create instance
            name,
            email,
            mobile,
            address: {
                street, locality, city, pincode, location
            },
            createdOn: new Date()
        })

        userResponse = await user.save();
        return res.status(200).json({ msg: 'User created successfully', userId: userResponse._id });
    } catch (error) {
        return res.status(404).json({ 'Server Error': error.message });
    }
}
)


//Get an existing user
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id });
        res.status(200).json(user);
    } catch (error) {
        return res.status(500).send('Server Error' + error.message);
    }

})

//Update an existing user
router.put('/:id', async (req, res) => {
    try {
        let findUser = await User.findById(req.params.id);
        if (!findUser) {
            return res.status(404).json({ msg: "User not found" });
        }
        const { name, mobile, email, address } = req.body; //destructure data from existing user
        const { street, locality, city, pincode, location } = address;

        if (findUser.email && findUser.email != email) {
            return res.status(406).json({ msg: "You can change the email address" });
        }

        let data = {};
        //map userData
        data.name = name && name;
        data.mobile = mobile && mobile;
        data.address = {};
        data.address.street = (street && street) || '';
        data.address.locality = (locality && locality) || '';
        data.address.city = (city && city) || '';
        data.address.pincode = (pincode && pincode) || '';
        data.address.location = {};

        data.address.location.type = (location.type && location.type) || '';
        data.address.location.coordinates = (location.coordinates && location.coordinates) || [];

        await User.updateOne({ _id: req.params.id }, { $set: data });
        res.status(200).json({ msg: "User updated successfully" });
    } catch (error) {
        return res.status(500).send('Server Error' + error.message);
    }
})


//Delete an existing user
router.delete('/:id', async (req, res) => {
    try {
        let findUser = await User.findById(req.params.id);
        if (!findUser) {
            return res.status(404).json({ msg: "User not found" });
        }
        await User.deleteOne({ _id: req.params.id });
        res.status(200).json({ msg: "User deleted successfully" });
    } catch (error) {
        return res.status(500).send('Server Error' + error.message);
    }

})

//list all the users
router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        return res.status(500).send('Server Error' + error.message);
    }

})


// List the Users sorted by createdOn timestamp with Pagination 
// & limit the number of user per page
router.get('/', async (req, res) => {
    try {
        let limit = 50;
        let count = 0;
        let pageNum = 1;
        let skip = 0;
        if (req.query.limit) {
            limit = parseInt(req.query.limit)
        }
        if (req.query.pageNum) {
            pageNum = req.query.pageNum;
            skip = (limit) * (pageNum - 1);
        }
        const users = await User.find().skip(skip).limit(limit).sort({ createdOn: -1 });
        count = users && users.length;
        res.status(200).json({ users, paging: { count, limit } });
    } catch (error) {
        return res.status(500).send('Server Error' + error.message);
    }

})

//Get all Users sorted by their distance from coordinates passed
router.get('/', async (req, res) => {
    try {
        if (!req.query.coordinates || typeof req.query.coordinates == "array") {
            return res.status(406).json({ msg: "Coordinates must be an array" });
        }
        const users = await User.find({
            'address.location':
            {
                $near:
                {
                    $geometry: { type: "Point", coordinates: req.query.coordinates },
                    $minDistance: 1000,
                    $maxDistance: 5000
                }
            }
        });
        res.status(200).json(users);
    } catch (error) {
        return res.status(500).send('Server Error' + error.message);
    }

})

module.exports = router;