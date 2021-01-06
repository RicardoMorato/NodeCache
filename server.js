const express = require('express');
const axios = require('axios');
const redis = require('redis');

const redisClient = require('./redis-client');

const app = express();

const port = process.env.PORT || 3000;

// Connecting to the local instance of redis
const client = redis.createClient(process.env.REDIS_URL);

client.on('error', (error) => {
  console.error(error);
});

app.get('/recipe/:foodItem', async (req, res) => {
  try {
    const { foodItem } = req.params;

    // Check the redis store for the data first
    const data = await redisClient.getAsync(foodItem)

    if (data) {
      return res.status(200).send({
        error: false,
        message: `Recipe for ${foodItem} from the cache`,
        data: JSON.parse(data),
      })
    } else {
      const recipe = await axios.get(`http://www.recipepuppy.com/api/?q=${foodItem}`);
      await redisClient.setAsync(foodItem, 1440, JSON.stringify(recipe.data.results));
      return res.status(200).send({
        error: false,
        message: `Recipe for ${foodItem} from the server`,
        data: recipe.data.results,
      });
    }
  } catch (err) {
    console.log(err);
  }
})

app.listen(port, () => {
  console.log(`Server up and running on port ${port}`);
});

module.exports = app;
