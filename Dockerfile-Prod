FROM circleci/ruby:2.7.2-node-browsers

# Set the default shell to a bash login shell
USER root
SHELL ["/bin/bash", "--login", "-c"]

# Install system dependencies
RUN apt-get update && apt-get install -y cmake pkg-config graphviz plotutils
# Install bundler
RUN gem install bundler:2.1.4

# Source build-time environment variables
ARG BUNDLE_GITHUB__COM

# Source run-time environment variables
ENV NG_CLI_ANALYTICS=ci \
    BUNDLE_GITHUB__COM=$BUNDLE_GITHUB__COM \
    RAILS_ENV=$RAILS_ENV \
    RUBYOPT=$RUBYOPT \
    DISABLE_RECAPTCHA=$DISABLE_RECAPTCHA \
    INTERCOM_APP_ID=$INTERCOM_APP_ID \
    KYC2020_API_KEY=$KYC2020_API_KEY \
    KYC2020_EMAIL=$KYC2020_EMAIL \
    LOG_LEVEL=$LOG_LEVEL \
    RAILS_EAGER_LOAD=$RAILS_EAGER_LOAD \
    THIRD_PARTY_CALLS_ENABLED=$THIRD_PARTY_CALLS_ENABLED \
    ZT_SANDBOX=$ZT_SANDBOX \
    E2E_ADMIN_PASSWORD=$E2E_ADMIN_PASSWORD \
    VCR_CALLS_ENABLED=$VCR_CALLS_ENABLED \
    VCR_CLOUD_CALLS_ENABLED=$VCR_CLOUD_CALLS_ENABLED \
    AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
    AWS_ACCESS_KEY=$AWS_ACCESS_KEY \
    AWS_S3_VCR_BUCKET=$AWS_S3_VCR_BUCKET \
    AWS_REGION=$AWS_REGION \
    DATABASE_HOST=$DATABASE_HOST \
    DATABASE_PORT=$DATABASE_PORT \
    REDIS_URL=$REDIS_URL \
    ZTT_BASE_URL=$ZTT_BASE_URL

# Create service directory
RUN mkdir -p /foghorn
WORKDIR /foghorn

# Expose ports in the container
EXPOSE 3001

# Install app dependencies
COPY Gemfile* ./
RUN bundle install
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Create production build
RUN npm run build-prod

# Set default command that is called when the container runs
CMD ./scripts/docker_start.sh
