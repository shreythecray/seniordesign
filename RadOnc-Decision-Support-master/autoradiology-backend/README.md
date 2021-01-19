# ROLRS Backend Web Server

`autorad-backend` is the backend web server that serves the data for `autorad-ws`, the frontend server. It is a [Node.js](https://nodejs.org/en/) that runs [Express.js](https://expressjs.com/) for routing. Most of the crucial routes are in `routes` but the authentication logic is in `app.js`. The server uses [Passport.js](http://www.passportjs.org/) for authentication and [node-postgres](https://node-postgres.com/) to communicate with the database. The server essentially acts as a proxy between the frontend and the database, mostly making database queries and forwarding the response to the frontend. 

This container is not externally accessible.

To run the server with the rest of the components, follow the instructions in the main `README`. 