// swagger.js
import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'Your API Title',
    description: 'A description of your API',
  },
  host: `localhost:${process.env.PORT}`,
  schemes: ['http'],
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./app.js','./controllers/*js']; // The file where your routes are defined

swaggerAutogen()(outputFile, endpointsFiles, doc)
