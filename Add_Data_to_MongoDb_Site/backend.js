const express = require('express');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { Binary } = require('mongodb');
const app = express();
const upload = multer({ dest: 'uploads/' });
const Jimp = require('jimp');

require('dotenv').config()
//const faceapi = require('face-api.js');
//const canvas = require('canvas');
//const { Canvas, Image, ImageData } = canvas;

const mongoUri = process.env.CONNECTION_STRING;
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
app.get('/api/jobs', async (req, res) => {
  try {
    const jobsCollection = client.db('NLIC_DATABASE').collection('Jobs');
    const jobs = await jobsCollection.find().toArray();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a job
app.post('/api/jobs', async (req, res) => {
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
app.get('/api/people', async (req, res) => {
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
app.post('/api/people', upload.single('imageFile'), async (req, res) => {
  const { personName, jobId, personDescription, contactNumber, workLocation } = req.body;
  const imageFile = req.file;

  if (!imageFile) {
    return res.status(400).json({ message: 'No image uploaded' });
  }

  try {

    
     // Hook up face-api.js to use node-canvas
     /*faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

     // Load face detection model
       // Load face detection model
       try {
         // Load face detection model from local disk
         await faceapi.nets.ssdMobilenetv1.loadFromUri('/models/ssd_mobilenetv1_model-weights_manifest.json');
 
     
         // Continue with image processing...
       } catch (error) {
           console.error('Error loading face-api.js model:', error);
           res.status(500).json({ error: error.message });
       }*/
    //const fileData = fs.readFileSync(tempPath, { encoding: 'base64' });
    //Note: will optamize images:
    //convert all images to jpeg
    //optamize image to resize (1280, 1280)
    //optamize image so it resizes around the persons face...
    //compress the image
    //upload base64 to database
     

        

     /* const img = await canvas.loadImage(imageFile.path);
      const detections = await faceapi.detectSingleFace(img);
  
      if (detections) {
        const { x, y, width, height } = detections.box;
    
        // Center the face in the crop
        const centerX = x + width / 2;
        const centerY = y + height / 2;
    
        // Calculate the crop box (make sure it fits within the image boundaries)
        const cropSize = Math.min(image.bitmap.width, image.bitmap.height);
        const left = Math.max(0, centerX - cropSize / 2);
        const top = Math.max(0, centerY - cropSize / 2);
    
        // Crop the image to focus on the face
        image.crop(left, top, cropSize, cropSize);
    
        // Resize the cropped image to 1280x1280
        image.resize(1280, 1280);
      } else {
        console.log("no face detected");
        // If no face is detected, fall back to resizing the whole image
        image.resize(1280, 1280);
      }*/


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

app.listen(3100, () => {
  console.log('Server is running on port 3100, v1.0.7');
});
