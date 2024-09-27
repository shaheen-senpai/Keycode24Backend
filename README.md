

# KeyCode2024 - Backend Service

## Overview

This repository contains the backend service developed for **KeyCode2024** hackathon. The service is designed to handle key functionalities with a focus on performance, scalability, and ease of integration. It leverages modern technologies and follows best practices to ensure seamless operation and maintainability.

## Features

- **API-driven architecture**: RESTful APIs for seamless communication with other components.
- **Scalable**: Built with scalability in mind to handle varying loads.
- **Secure**: Implements security best practices.
- **High performance**: Optimized for fast responses.
- **Database integration**: Robust interaction with the database for CRUD operations.
  
## Technologies

- **Framework**: [NestJS](https://nestjs.com/)
- **Language**: TypeScript
- **Database**: PostgreSQL (or insert your choice)
- **ORM**: TypeORM (or insert your choice)
- **Validation**: Joi (for schema validation)
- **Testing**: Jest (or insert your choice)

## Installation

1. **Clone the repo**:
   ```bash
   git clone https://github.com/yourusername/your-repo-name.git
   cd your-repo-name
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

## Running the App

1. **Create Environment Files**:
   - Create a `.env` file and copy the data from `env.sample`. Make sure to fill in all required values.
   - Create a `docker.env` file and copy the data from `docker.env.sample`. Enter all necessary values for Docker.

2. **Set Up Database**:
   - After running the `docker-compose up` command, ensure the database is created (if it doesn't exist).
   - Update the database name and credentials in the `.env` file, and proceed with the following steps.

### Development

Run the following commands to start the development environment:

```bash
# Start the Docker containers
$ docker-compose up

# Run database migrations
$ npm run run-migrations

# Start the app in debug mode
$ npm run start:debug

Run following command to generate migration
$ npm run generate-migration --name=migrationFileName

# production
$ npm run start:server

```

## API Documentation

The API follows RESTful conventions and can be tested through API clients like [Postman](https://www.postman.com/) or [Insomnia](https://insomnia.rest/). Refer to the Swagger documentation at `/api/docs`.

## Contributing

We welcome contributions! If you're interested in improving this project, please follow the steps below:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m 'Add your feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
