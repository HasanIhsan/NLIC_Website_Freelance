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
//const faceapi = require('face-api.js');
//const canvas = require('canvas');
//const { Canvas, Image, ImageData } = canvas;

require('dotenv').config()


const apiKey = process.env.API_KEY;
const dataApiUrl = process.env.DATA_API_URL;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



 


// Get all jobs
app.get('/api/jobs', async (req, res) => {
  try {
    const response = await axios.post(`${dataApiUrl}/action/find`, {
      collection: 'Jobs',
      database: 'NLIC_DATABASE',
      dataSource: 'Cluster0',
    }, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      }
    });
    res.json(response.data.documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//get all people
app.get('/api/peoples', async(req, res) => {
  try {
    const responce = await axios.post(`${dataApiUrl}/action/find`, {
      collection: 'People',
      database: 'NLIC_DATABASE',
      dataSource: 'Cluster0',
    }, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      }
    });
    res.json(responce.data.documents);
  } catch(error) {
    res.status(500).json({error: error.message});
  }
});

// Add a job
app.post('/api/jobs', async (req, res) => {
  const { name } = req.body;
  try {
    // Check if the job already exists
    const existingJobResponse = await axios.post(`${dataApiUrl}/action/findOne`, {
      collection: 'Jobs',
      database: 'NLIC_DATABASE',
      dataSource: 'Cluster0',
      filter: { name }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      }
    });

    if (existingJobResponse.data.document) {
      return res.json(existingJobResponse.data.document);
    }

    // Add new job
    const addJobResponse = await axios.post(`${dataApiUrl}/action/insertOne`, {
      collection: 'Jobs',
      database: 'NLIC_DATABASE',
      dataSource: 'Cluster0',
      document: { name }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      }
    });

    res.json(addJobResponse.data.insertedId);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

 

 

// Get all people by job ID
app.get('/api/people', async (req, res) => {
  const { jobId } = req.query;
  try {
    const response = await axios.post(`${dataApiUrl}/action/find`, {
      collection: 'People',
      database: 'NLIC_DATABASE',
      dataSource: 'Cluster0',
      filter: { jobId: { $oid: jobId } }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      }
    });
    res.json(response.data.documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//get a person by id
app.get('/api/person/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const response = await axios.post(`${dataApiUrl}/action/find`, {
      collection: 'People',
      database: 'NLIC_DATABASE',
      dataSource: 'Cluster0',
      filter: { _id: { $oid: id } }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      }
    });
    res.json(response.data.documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

//get all reviews by people ID
app.get('/api/reviews', async(req, res) => {
  const {personId} = req.query;

  try{
    const responce = await axios.post(`${dataApiUrl}/action/find`, {
      collection: 'Reviews',
      database: 'NLIC_DATABASE',
      dataSource: 'Cluster0',
      filter: {personId: {$oid: personId}}
    }, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      }
    });
    res.json(responce.data.documents);
  }catch(error) {
    res.status(500).json({error: error.message});
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
    // Read image file as base64
    const { originalname, path: tempPath, mimetype } = imageFile;
    

    //the following code is for canvas and face-api
    //this works only locally...
    //i get a invalid ELF header once i try to move it to netlify
    //i'll have to figure out why this is happening and how to fix it!
    /*    // Hook up face-api.js to use node-canvas
    faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

    // Load face detection model
    try {
      // Load face detection model from local disk
      await faceapi.nets.ssdMobilenetv1.loadFromDisk(path.join(__dirname, 'models'));
  
      // Continue with image processing...
  } catch (error) {
      console.error('Error loading face-api.js model:', error);
      res.status(500).json({ error: error.message });
  }

 
    //Note: will optamize images:
    //convert all images to jpeg
    //optamize image to resize (1280, 1280)
    //optamize image so it resizes around the persons face...
    //compress the image
    //upload base64 to database
    const image = await Jimp.read(imageFile.path);

    // Convert Jimp image to a format usable by face-api.js
    const img = await canvas.loadImage(imageFile.path);
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
   
    const image = await Jimp.read(imageFile.path);
    image.quality(80).resize(1280, 1280);// Adjust quality if needed (0-100, 100 being the best quality)
    const fileData = await image.getBase64Async(Jimp.MIME_JPEG);
    const base64Data = fileData.replace(/^data:image\/\w+;base64,/, "");
    const mimeType = Jimp.MIME_JPEG;
 
    
    // Check if the person already exists
    const existingPersonResponse = await axios.post(`${dataApiUrl}/action/findOne`, {
      collection: 'People',
      database: 'NLIC_DATABASE',
      dataSource: 'Cluster0',
      filter: { personName }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      }
    });

    if (existingPersonResponse.data.document) {
      return res.status(400).json({ message: 'Person already exists' });
    }

    const person = {
      personName,
      jobId: { $oid: jobId },
      personDescription,
      image: {
        filename: originalname,
        contentType: mimeType,
        data: base64Data
      },
      contactNumber,
      workLocation,
      memberShipNum: 0
    };

    
    // Insert person data into MongoDB using Data API
    const addPersonResponse = await axios.post(`${dataApiUrl}/action/insertOne`, {
      collection: 'People',
      database: 'NLIC_DATABASE',
      dataSource: 'Cluster0',
      document: person
    }, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      }
    });

    console.log(`added person: ${person.jobId}: ${person.personName}`);
   // res.json({ _id: addPersonResponse.data.insertedId, ...person });
   res.json(`added person: ${person.jobId}: ${person.personName}`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
 
//update user information:
app.put('/api/person/:id', upload.single('imageFile'), async (req, res) => {
  const personId = req.params.id;
  const { personName, jobId, personDescription, contactNumber, workLocation, memberShipNum } = req.body;
  const updatedData = {
    personName,
    jobId: { $oid: jobId },
    personDescription,
    contactNumber,
    workLocation,
    memberShipNum
  };

  if (req.file) {
    try {
      // Process the image file with Jimp
      const image = await Jimp.read(req.file.path);
      image.quality(80).resize(1280, 1280);
      const fileData = await image.getBase64Async(Jimp.MIME_JPEG);
      const base64Data = fileData.replace(/^data:image\/\w+;base64,/, "");
      updatedData.image = {
        filename: req.file.originalname,
        contentType: Jimp.MIME_JPEG,
        data: base64Data
      };
    } catch (error) {
      return res.status(500).json({ error: 'Error processing image' });
    }
  }

  try {
    // Update the person data in MongoDB using Data API
    const updatePersonResponse = await axios.post(`${dataApiUrl}/action/updateOne`, {
      collection: 'People',
      database: 'NLIC_DATABASE',
      dataSource: 'Cluster0',
      filter: { _id: { $oid: personId } },
      update: { $set: updatedData }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      }
    });

    if (updatePersonResponse.data.matchedCount === 0) {
      return res.status(404).json({ message: 'Person not found' });
    }

    res.json({ message: 'Person updated successfully' });
  } catch (error) {
    console.error('Error updating person:', error);
    res.status(500).json({ error: 'Failed to update person' });
  }
});
 
//deelte a job by id
app.delete('/api/jobs/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Step 1: Find all people associated with the job
    const peopleResponse = await axios.post(`${dataApiUrl}/action/find`, {
      collection: 'People',
      database: 'NLIC_DATABASE',
      dataSource: 'Cluster0',
      filter: { jobId: { $oid: id } }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      }
    });

    const people = peopleResponse.data.documents;
    const peopleIds = people.map(person => person._id);

    //console.log(people);
    console.log(peopleIds);
    // Step 2: Delete reviews associated with the people
    if (peopleIds.length > 0) {
      await axios.post(`${dataApiUrl}/action/deleteMany`, {
        collection: 'Reviews',
        database: 'NLIC_DATABASE',
        dataSource: 'Cluster0',
        filter: { personId: { $in: peopleIds.map(id => ({ $oid: id })) } }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey
        }
      });
    }

    // Step 3: Delete the people
    if (peopleIds.length > 0) {
      await axios.post(`${dataApiUrl}/action/deleteMany`, {
        collection: 'People',
        database: 'NLIC_DATABASE',
        dataSource: 'Cluster0',
        filter: { _id: { $in: peopleIds.map(id => ({ $oid: id })) } }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey
        }
      });
    }

    // Step 4: Delete the job
    await axios.post(`${dataApiUrl}/action/deleteOne`, {
      collection: 'Jobs',
      database: 'NLIC_DATABASE',
      dataSource: 'Cluster0',
      filter: { _id: { $oid: id } }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      }
    }); 

    res.json({ message: 'Job and associated people deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


//delete a review by id
app.delete('/api/reviews/:id', async (req, res) => {
  const { id } = req.params;
 try{

    // Delete the review
    await axios.post(`${dataApiUrl}/action/deleteOne`, {
      collection: 'Reviews',
      database: 'NLIC_DATABASE',
      dataSource: 'Cluster0',
      filter: { _id: { $oid: id } }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      }
    }); 

    res.json({ message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.listen(3100, () => {
  console.log('Server is running on port 3100, v1.0.7');
});
