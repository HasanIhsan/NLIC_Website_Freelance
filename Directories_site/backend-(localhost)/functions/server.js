const express = require('express');
const serverless = require('serverless-http');
const app = express();
const router = express.Router();
const cors = require('cors');
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');

// MongoDB connection string (replace with your credentials)
const uri = "mongodb+srv://ihsanhassanbusiness:Mmaster20010901@cluster0.mjm2ill.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
//const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let db;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


// Connect to MongoDB and reuse the connection
async function connectToDB() {
  if (!db) {
    try {
      await client.connect();
      db = client.db('NLIC_DATABASE');
      console.log('Connected to MongoDB');
    } catch (err) {
      console.error('Failed to connect to MongoDB', err);
      throw new Error('Database connection failed');
    }
  }
}

app.use(cors());
app.use(express.json());

// Simple health check
app.get('/',  async (req, res) => {
  
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    res.send('App is running.. v1.0.10');
  }catch(error) {
    res.send(error);
  }
   

    
});

// Route to get Jobs with associated People and Reviews
app.get('/proxy', async (req, res) => {
  try {
    await connectToDB();
    const jobs = db.collection('Jobs');
    const result = await jobs.aggregate([
      {
        $lookup: {
          from: 'People',
          localField: '_id',
          foreignField: 'jobId',
          as: 'people',
          pipeline: [
            {
              $lookup: {
                from: 'Reviews',
                localField: '_id',
                foreignField: 'personId',
                as: 'reviews'
              }
            },
            {
              $project: {
                image: 0 // Exclude image data
              }
            }
          ]
        }
      },
      {
        $unwind: {
          path: '$people',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: '$_id',
          name: { $first: '$name' },
          people: {
            $push: {
              _id: '$people._id',
              name: '$people.personName',
              description: '$people.personDescription',
              contactNumber: '$people.contactNumber',
              workLocation: '$people.workLocation',
              reviews: '$people.reviews'
            }
          }
        }
      }
    ]).toArray();

    res.json(result);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


/*

// New route to get a person's image by their ID
app.get('/get-image/:id', async (req, res) => {
  const personId = req.params.id;

  try {
    const response = await axios.post(
      `${apiEndpoint}findOne`,
      {
        dataSource: 'Cluster0',
        database: dbName,
        collection: 'People',
        filter: { _id: { $oid: personId } },
        projection: { image: 1 } // Only return the image data
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'apiKey': apiKey
        }
      }
    );

    const imageData = response.data.document.image;
    if (imageData) {
      res.json(imageData);
    } else {
      res.status(404).json({ error: 'Image not found' });
    }
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.post('/submit-review', async (req, res) => {
  const { personId, review, rating } = req.body;

  if (!personId || !review || !rating) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const response = await axios.post(
      apiEndpoint,
      {
        dataSource: 'Cluster0',
        database: dbName,
        collection: reviewCollection,
        document: {
          personId: { $oid: personId },
          review: review,
          rating: parseInt(rating, 10),
          createdAt: { $date: new Date().toISOString() }
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'apiKey': apiKey
        }
      }
    );

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(201).json({ message: 'Review submitted', reviewId: response.data.insertedId });
  } catch (error) {
    console.error('Error inserting review:', error.response ? error.response.data : error.message);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
*/
const port = 3000;
app.listen(port, () => {
  console.log(`Proxy server running at http://localhost:${port}`);
});
