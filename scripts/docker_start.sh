#!/bin/bash

# Install missing dependencies
bundle check || bundle install
npm install

# Wait for services
dockerize -wait tcp://$DATABASE_HOST:$DATABASE_PORT -timeout 1m
dockerize -wait tcp://redis:6379 -timeout 1m

# Remove a potentially pre-existing server.pid
rm -f /foghorn/tmp/pids/server.pid

# Run server
if [ "$RAILS_ENV" == 'e2e' ]
then
    npm run build-prod
    bin/rails server -e $RAILS_ENV --binding 0.0.0.0 -p 3001
else
    npm run build-dev
    (npm run watch-dev)&
    bin/rails server --binding 0.0.0.0 -p 3001
fi
