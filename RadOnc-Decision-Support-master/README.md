# Radiation Oncology Literature Review System
Andy Wu; Scott Reichelt; Robert Tucker; Sonja Dietrich, PhD

ECS 193 Senior Design Project

Winter 2018 - Spring 2019

## About
The Radiation Oncology Literature Review System is designed to help assist radiation oncologists' need to stay up to date in an active area of research that is changing rapidly. The goal of this system is to reduce the time it takes for a radiation oncologist to adopt cutting edge practices that have reached trial stages which make them viable options for treatment.

## Usage
The system uses [Docker](https://www.docker.com/products/docker-desktop) and [Docker Compose](https://docs.docker.com/compose/) to orchestrate all of the components. Please install both of these before proceeding.

First, get the code:
```
git clone https://github.com/awu/ecs193.git
```

Next, start the system:
```
docker-compose up -d --build
```

The last step could take a while to run since it downloads and install all dependencies. But that's it! After it is running, you can navigate to http://localhost:3000 to access it.

## Project Structure
The project is made up of four parts, each representing a separate Docker container. `autoradiology-backend` holds the backend web server, `autoradiology-db` holds the database, `autoradiology-go` holds the model server, and `autoradiology-ws` holds the frontend web server. Please see the `README` in each of these folders to view a more detailed description of each.
