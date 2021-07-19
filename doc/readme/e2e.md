# e2e
There are two types of E2E tests:

1. UI driven using Cypress
2. API driven using ruby

For all of them you need to have all micro-service configured and running (including Foghorn) locally.

**Note:** If you want to test a specific branch then that branch has to be running the code.

#### Step 1: Configure environment

* Set the environment variables E2E_ADMIN_PASSWORD and CYPRESS_E2E_ADMIN_PASSWORD to the password that has been shared in LastPass:

  * **Shared folder:** Shared-Development Env Credentials

  * **Credential:** E2E Admin Creds

* Set the environment variable FONTAWESOME_NPM_AUTH_TOKEN to the value shared in LastPass:

 * **Shared folder:** Shared-Development Env Credentials

 * **Credential:** Font Awesome Pro npm Auth Token

* Set the environment variable THIRD_PARTY_CALLS_ENABLED to true

* Set the environment variable CYPRESS_TOKEN_CLIENT_ID to the `uid` value of the `e2e_application` defined in the roadrunner `seeds.rb` file

* Set the environment variable CYPRESS_TOKEN_CLIENT_SECRET to the `secret` value of the `e2e_application` defined in the roadrunner `seeds.rb` file

* You must also add the following entry to the line starting with `127.0.0.1` in your `/etc/hosts` file:

```
id.e2e-admin.zetatango.local skinfxtest.zetatango.local
```

* Clear redis cache

```
redis-cli flushall
```

* Make sure you have VCR and AWS credentials setup (see **Set up VCR** section above)


* Install or upgrade ChromeDriver:

```
brew tap homebrew/cask && brew install --cask chromedriver
```

If you are having problems with tests failing locally that are passing on CI, you may need to run

```
rake assets:precompile
```

in this or another repo.  Note that it may not be up to date for local e2e even if it already is for your regular local dev environment.

#### Step 2: Bring up services

To prepare the services for E2E, run the following in each of the project directories:

```
RAILS_ENV=e2e rails db:reset
rails s -e e2e
```

For foghorn, you will need to run:

```
npm run build-prod // <-- wait for this to return (will take a few minutes)
rails s -e e2e
```

#### Step 3: Run the E2E tests

For running API and Capybara E2E tests:
```
rails e2e
```

For running UI E2E tests (from foghorn base folder):
```
npm run cypress:open
```

For running UI E2E tests in headless mode:
```
npm run cypress:run
```

You can also run cypress with CPU and memory stats by running:

```
npm run cypress:run-profile
```