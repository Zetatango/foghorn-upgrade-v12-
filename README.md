[![CircleCI](https://circleci.com/gh/Zetatango/foghorn.svg?style=svg&circle-token=96488ef4d9114e48761c1ec17c389dda3e91d17d)](https://circleci.com/gh/Zetatango/foghorn) [![codecov](https://codecov.io/gh/Zetatango/foghorn/branch/master/graph/badge.svg?token=aeQLgEIliv)](https://codecov.io/gh/Zetatango/foghorn) Ruby: [![Depfu](https://badges.depfu.com/badges/c9d769888ca0f35b0c244bda1e016bff/overview.svg)](https://depfu.com/repos/Zetatango/foghorn?project_id=6635) NPM: [![Depfu](https://badges.depfu.com/badges/776b62c147fae36eca2dbf0b3112a89f/overview.svg)](https://depfu.com/repos/Zetatango/foghorn?project_id=6636)

# README
This is the repo for **Thinking Capital's Merchant Portal**, formerly *ZetaTango's White Label Merchant Portal (WLMP)*.

The portal run on Rails and the UI is written in [Angular](https://github.com/angular).

## 1. Environment Setup
[Environment setup docs](https://github.com/Zetatango/zetatango/blob/master/doc/env.md)


---
## 2. Run Application

##### Compile + Run Angular
``` bash
npm install
npm run dev:watch
```
##### Run Rails server
``` bash
bundle install
rails server
```
### Testing
##### Rails Minitest tests
``` bash
rails test
```

##### Angular Jasmine tests
``` bash
npm run dev:test
```

All tests should pass with a success message something like `Executed X of X SUCCESS`.

---

## Docs
|Category|Description|Link|
|--|--|--|
|commands|Description of commands in package.json|[link](doc/readme/commands.md)|
|contributing|How to contribute to the repo|[link](doc/readme/contributing.md)|
|e2e|Setting up e2e for API(Capybara) or UI(cypress) driven tests |[link](doc/readme/e2e.md)|
|eslint|Setting up linter for Typescript/Angular |[link](doc/readme/angular.md)|
|rubocop|Setting up linter for Ruby/Rails|[link](doc/readme/rubocop.md)|

## Old Docs
|Category|Description|Link|
|--|--|--|
|Docker|Setting up Docker for development|[link](doc/readme/docker.md)|
|env setup|Previous dev env setup|[link](doc/readme/env.md)|
|HTTPS|Setting up HTTPS for development|[link](doc/readme/https.md)|
|miscellaneous||[link](doc/readme/misc.md)|
|Partner vanity|Setting up partner vanities for development|[link](doc/readme/vanity.md)|
