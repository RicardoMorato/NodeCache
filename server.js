const express = require('express');
const axios = require('axios');
const redis = require('redis');

const app = express();

const port = 8080;

// Connecting to the local instance of redis
const client = redis.createClient(6379);

client.on('error', (error) => {
  console.error(error);
});

app.get('/recipe/:foodItem', async (req, res) => {
  try {
    const { foodItem } = req.params;

    // Check the redis store for the data first
    client.get(foodItem, async (err, recipe) => {
      if (recipe) {
        return res.status(200).send({
          error: false,
          message: `Recipe for ${foodItem} from the cache`,
          data: JSON.parse(recipe),
        });
      } else { // When data is not found in the cache, we should make a request to the server
        const recipe = await axios.get(`http://www.recipepuppy.com/api/?q=${foodItem}`);

        // Save the record in the cache for subsequent requests
        client.setex(foodItem, 1440, JSON.stringify(recipe.data.results));

        // Return the result to the client
        return res.status(200).send({
          error: false,
          message: `Recipe for ${foodItem} from the server`,
          data: recipe.data.results,
        });
      }
    })

  } catch (err) {
    console.log(err);
  }
})

app.listen(port, () => {
  console.log(`Server up and running on port ${port}`);
});

module.exports = app;
