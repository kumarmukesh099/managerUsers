const express = require('express');
const connectMongoDb = require('./config/db');
const { json, urlencoded } = express;
const app = express();
const PORT = process.env.PORT || 3000;

//establish mongodb cnnection
connectMongoDb();

//init middleware
app.use(json());
app.use(urlencoded({ extended: false }));

//users route
app.use('/api/users',require('./routes/users'));

app.listen(PORT, () => {
    console.log(`Web Server started on port ${PORT}`);
})
