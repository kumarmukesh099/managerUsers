const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const User = require('../models/User');

//Create user
router.post('/', [
    check('name', 'Name is required').notEmpty(),
    check('email', 'Please enter a valid email Id').isEmail(),
    check('mobile', 'Please enter the correct Mobile number').isMobilePhone("any").isLength(10)
], async (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(404).json({ errors: errors.array() });
    }

    let { name, email, mobile, address } = req.body;
    let { street, locality, city, pincode, location } = address;
    if (!location) { location = {}; }
    let userResponse;
    try {
        let user = await User.findOne({ mobile });  //mobile number is unique, two person can't have same mobile number
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

        if (findUser.mobile && findUser.mobile != mobile) { //if we want to give authority to change the number then instead of this condition , we can check the new mobile number in db whether duplicate or not 
            return res.status(406).json({ msg: "You can't change the mobile number" });
        }

        let data = {};
        //map userData
        data.name = name && name;
        data.email = email && email;
        data.address = {};
        data.address.street = (street && street) || '';
        data.address.locality = (locality && locality) || '';
        data.address.city = (city && city) || '';
        data.address.pincode = (pincode && pincode) || '';
        updatedOn = new Date();
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


// List the Users sorted by createdOn timestamp with Pagination 
// Limit the number of user per page
// List the nearest users
router.get('/', async (req, res) => {
    try {
        let limit = 0;  //limit per page , we can set here default limit per page
        let count = 0; //number of returned records
        let pageNum = 1;  //page number , bydefault 1 
        let skip = 0;
        let output; //
        if (req.query.limit) {
            limit = parseInt(req.query.limit)
        }
        if (req.query.pageNum) {
            pageNum = req.query.pageNum;
            skip = (limit) * (pageNum - 1);
        }
        let queries = {}; 
        if (req.query.coordinates) {
            req.query.coordinates = JSON.parse(req.query.coordinates);
            queries = {
                'address.location':
                {
                    $near:
                    {
                        $geometry: { type: "Point", coordinates: req.query.coordinates },
                        $minDistance: 0,
                        $maxDistance: 500
                    }
                }
            };
        }
       
        const users = await User.find(queries).skip(skip).limit(limit).sort({ createdOn: -1 });
        count = users && users.length;
        output = { users, paging: { count } };
        if (limit) {
            output.paging.limit = limit;
        }
        res.status(200).json(output);
    } catch (error) {
        return res.status(500).send('Server Error' + error.message);
    }

})


module.exports = router;