const express = require('express');
const serverless = require('serverless-http');
const app = express();
const router = express.Router();
const axios = require('axios');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');


 

//Get all students
router.get('/', (req, res) => {
  res.send('App is running.. v1.0.10');
});


const apiEndpoint = 'https://us-east-2.aws.data.mongodb-api.com/app/data-capmckh/endpoint/data/v1/action/';
const apiKey = '1iO7ax1hAaBEgS5TIPv760HC06gm2lZvxGj9OsUfRZpkmwO2yd03noaDzo5XrXuJ';

const dbName = 'NLIC_DATABASE';
const reviewCollection = 'Reviews';

app.use(cors());
app.use(express.json());


router.get('/proxy', async (req, res) => {
  try {
    const response = await axios.post(
      `${apiEndpoint}aggregate`,
      {
        dataSource: 'Cluster0',
        database: 'NLIC_DATABASE',
        collection: 'Jobs',
        pipeline: [
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
                    // Exclude the image data
                    image: 0
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
                  // Exclude image here as well
                }
              }
            }
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/ejson',
          Accept: 'application/json',
          apiKey: apiKey
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error making request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// New route to get a person's image by their ID
router.get('/get-image/:id', async (req, res) => {
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

//https://us-east-2.aws.data.mongodb-api.com/app/data-capmckh/endpoint/data/v1/action/insertOne
router.post('/submit-review', async (req, res) => {
  const { personId, review, rating } = req.body;

  if (!personId || !review || !rating) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const response = await axios.post(
      `${apiEndpoint}insertOne`,
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



app.use('/.netlify/functions/api', router);
module.exports.handler = serverless(app);
