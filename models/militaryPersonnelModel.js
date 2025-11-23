// models/militaryPersonnelModel.js
const mongoose = require('mongoose');

const militaryPersonnelSchema = new mongoose.Schema({
    militaryId: { type: String, required: true, unique: true },
    lastName: { type: String, required: true },
    firstName: { type: String, required: true },
    middleName: { type: String },
    birthDate: { type: Date, required: true },
    rank: { type: String, required: true },
    position: { type: String, required: true },
    unit: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    emergencyContact: {
        name: String,
        phone: String,
        relationship: String
    },
    medicalInfo: {
        bloodType: String,
        allergies: String,
        medications: String
    },
    serviceStartDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'inactive', 'leave'], default: 'active' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Індекси для пошуку
militaryPersonnelSchema.index({ lastName: 1, firstName: 1 });
militaryPersonnelSchema.index({ militaryId: 1 });
militaryPersonnelSchema.index({ status: 1 });

module.exports = mongoose.model('MilitaryPersonnel', militaryPersonnelSchema);