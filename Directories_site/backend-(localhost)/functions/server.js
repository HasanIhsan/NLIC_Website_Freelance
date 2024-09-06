const express = require('express');
const serverless = require('serverless-http');
const axios = require('axios');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const app = express();
const port = 3000;
require('dotenv').config()


const apiEndpoint = process.env.ATA_API_URL_ENDPOINT;
const apiKey = process.env.API_KEY;

const dbName = 'NLIC_DATABASE';
const reviewCollection = 'Reviews';

 

app.use(cors());
app.use(express.json());

app.get('/proxy', async (req, res) => {
  try {
    const response = await axios.post(
      'https://us-east-2.aws.data.mongodb-api.com/app/data-capmckh/endpoint/data/v1/action/aggregate',
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
                  description: '$people.personDescription', // Use the correct field name
                  contactNumber: '$people.contactNumber',
                  workLocation: '$people.workLocation',
                  image: '$people.image', // Directly accessing the image object
                  reviews: '$people.reviews'
                }
              }
            }
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/ejson',
          'Accept': 'application/json',
          'apiKey': '1iO7ax1hAaBEgS5TIPv760HC06gm2lZvxGj9OsUfRZpkmwO2yd03noaDzo5XrXuJ'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error making request:', error);
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

app.listen(port, () => {
  console.log(`Proxy server running at http://localhost:${port}`);
});
