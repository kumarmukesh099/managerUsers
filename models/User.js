const mongoose = require('mongoose');
const userSchema = mongoose.Schema({
    name: {
       type  : String,
       required : true
    },
    email: {
        type: String,
        required: 1
    },
    mobile: {
        type  : String,
       required : true,
       unique: true 
    },
    address: {
        type: Object,

        street: {
            type: String,
            required: 1
        },
        street: {
            type: String
        },
        locality: {
            type: String
        }, city: {
            type: String
        },
        state: {
            type: String
        },
        pincode: {
            type: String
        },
        location : {
            index: '2dsphere',
            type: {
                type: String
            },  
            coordinates: {
                type: Array
            },
        }
    },
    createdOn : {
        type : Date
    }
});

module.exports = mongoose.model('user', userSchema);