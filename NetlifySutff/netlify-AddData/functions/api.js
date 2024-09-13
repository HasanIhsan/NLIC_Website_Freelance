const express = require('express');
const serverless = require('serverless-http');
const app = express();
const router = express.Router();

const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const Jimp = require('jimp');
const { MongoClient, ObjectId } = require('mongodb');
const os = require('os');
const upload = multer({ dest: os.tmpdir() });

require('dotenv').config();

const mongoUri = "mongodb+srv://ihsanhassanbusiness:Mmaster20010901@cluster0.mjm2ill.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
client.connect(err => {
  if (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  }
  console.log('Connected to MongoDB');
});

// Get all jobs
router.get('/api/jobs', async (req, res) => {
  try {
    const jobsCollection = client.db('NLIC_DATABASE').collection('Jobs');
    const jobs = await jobsCollection.find().toArray();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a job
router.post('/api/jobs', async (req, res) => {
  const { name } = req.body;
  try {
    const jobsCollection = client.db('NLIC_DATABASE').collection('Jobs');
    
    // Check if the job already exists
    const existingJob = await jobsCollection.findOne({ name });
    if (existingJob) {
      return res.json(existingJob);
    }

    // Add new job
    const result = await jobsCollection.insertOne({ name });
    res.json(result.insertedId);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all people by job ID
router.get('/api/people', async (req, res) => {
  const { jobId } = req.query;
  try {
    const peopleCollection = client.db('NLIC_DATABASE').collection('People');
    const people = await peopleCollection.find({ jobId: new ObjectId(jobId) }).toArray();
    res.json(people);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a person with image stored as base64
router.post('/api/people', upload.single('imageFile'), async (req, res) => {
  const { personName, jobId, personDescription, contactNumber, workLocation } = req.body;
  const imageFile = req.file;

  if (!imageFile) {
    return res.status(400).json({ message: 'No image uploaded' });
  }

  try {
    // Read image file as base64
    const image = await Jimp.read(imageFile.path);
    image.quality(80); // Adjust quality if needed (0-100, 100 being the best quality)
    image.resize(1280, 1280);
    const fileData = await image.getBase64Async(Jimp.MIME_JPEG);
    const base64Data = fileData.replace(/^data:image\/\w+;base64,/, "");
    const mimeType = Jimp.MIME_JPEG;

    const peopleCollection = client.db('NLIC_DATABASE').collection('People');

    // Check if the person already exists
    const existingPerson = await peopleCollection.findOne({ personName });
    if (existingPerson) {
      return res.status(400).json({ message: 'Person already exists' });
    }

    const person = {
      personName,
      jobId: new ObjectId(jobId),
      personDescription,
      image: {
        filename: imageFile.originalname,
        contentType: mimeType,
        data: base64Data
      },
      contactNumber,
      workLocation,
      memberShipNum: 0
    };

    // Insert person data into MongoDB
    const result = await peopleCollection.insertOne(person);
    res.json(`added person: ${person.jobId}: ${person.personName}`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use('/.netlify/functions/api', router);
module.exports.handler = serverless(app);
