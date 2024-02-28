const swaggerJsDoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'YSpotyAPI',
            version: '1.0.0',
            description: 'A simple YSpotyAPI',
        },
        servers: [
            {
                url: 'http://localhost:3000',
            },
        ],
    },
    apis: ['./app.js'], // files containing annotations as above
};

const specs = swaggerJsDoc(options);
module.exports = specs;