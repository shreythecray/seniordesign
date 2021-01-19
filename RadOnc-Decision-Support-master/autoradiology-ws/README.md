# ROLRS Frontend Web Server

`autorad-ws` is the frontend web server that serves views to the user. It is written in Typescript and uses the [React](https://reactjs.org/) framework. It was created using [Create React App](https://github.com/facebook/create-react-app) so much of the boilerplate is from that. 

It uses both [React Bootstrap](https://react-bootstrap.github.io/) and [Semantic UI React](https://react.semantic-ui.com/) for UI components.

The main code is in the `src` folder, and `src/App.tsx` is where all of the components are located. All requests to the `autorad-backend` container are proxied as configured in `package.json`.

This is the only container that is externally accessible.

To run the server with the rest of the components, follow the instructions in the main `README`. 