const mongoose = require('mongoose');

const empSchema = new mongoose.Schema({
    name: String,
    age: Number,
    salary: Number
});

const Emp = mongoose.model('Emp', empSchema); // Create the model

module.exports = Emp;
