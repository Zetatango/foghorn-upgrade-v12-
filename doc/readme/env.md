# Environment Setup
It is assumed you are working on MacOS and have installed [homebrew](https://brew.sh/).

### Ruby

This application requires:

* Ruby version: 2.7.2

Ruby 2.7.2 and greater requires OpenSSL 1.1+. To link to Homebrew's upgraded version of OpenSSL, add the following to your bash profile

```bash
export RUBY_CONFIGURE_OPTS="--with-openssl-dir=$(brew --prefix openssl@1.1)"
```

If you do not have Ruby installed, it is recommended you use ruby-install and chruby to manage Ruby versions.

```bash
brew install ruby-install chruby
ruby-install ruby 2.7.2
```

Add the following lines to ~/.bash_profile:

```bash
source /usr/local/opt/chruby/share/chruby/chruby.sh
source /usr/local/opt/chruby/share/chruby/auto.sh
```

Set Ruby version to 2.7.2:

```bash
source ~/.bash_profile
chruby 2.7.2
```

[Here are some instructions for Linux](http://ryanbigg.com/2014/10/ubuntu-ruby-ruby-install-chruby-and-you)

### Bundler
Bundler gem management:
```bash
gem install bundler
```

### Rails
Rails web framework:
```bash
gem install rails
```


Redis in-memory data store (auto starts on login):
```bash
brew install redis
ln -sfv /usr/local/opt/redis/*.plist ~/Library/LaunchAgents
launchctl load ~/Library/LaunchAgents/homebrew.mxcl.redis.plist
```

To test redis is running execute `redis-cli ping`

##### Start Redis
If you haven't already, enable Redis by creating the file tmp/caching-dev.txt in your project directory:
```
touch tmp/caching-dev.txt
```

### node + npm
*Important:* Please referer to the `package.json` to find the versions of `node` & `npm` that we are currently using. The section looks like this:

``` json
"engines": {
  "node": "^14.16",
  "npm": "^7.7"
}
```

Now that you have the right versions, install node + npm

**Note**: if you already have node installed through homebrew, do the following:
```bash
brew list # If you see any node or node@12 (or similar) you’ll have to remove them.

# For each listed:
brew uninstall --ignore-dependencies <node install listed> # e.g. node@12
brew uninstall --force <node install listed>
```
Install NVM:
``` bash
brew update
brew install nvm # or brew reinstall nvm if it already exists.
```

It will tell you to add some code to your .zshrc file:
```bash
# This is an example at the time of writing. Use the one specified by the installer.
export NVM_DIR="$HOME/.nvm"
  [ -s "/usr/local/opt/nvm/nvm.sh" ] && . "/usr/local/opt/nvm/nvm.sh"  # This loads nvm
  [ -s "/usr/local/opt/nvm/etc/bash_completion.d/nvm" ] && . "/usr/local/opt/nvm/etc/bash_completion.d/nvm"  # This loads nvm bash_completion
```

Once that is done, type `zsh` to source your profile. Then do the following:
```bash
nvm install 14 # the major version of what is specified in package.json.
nvm alias default 14 
nvm use default
npm i -g npm@7 # the minor version or greater specified in the package.json.
```

### Angular
```bash
npm install -g @angular/cli # installs Angular globally at latest version
```

#### Add Env Creds to ~/.zshenv
We use VCR to mock certain 3rd party responses, so in order to go through the flow locally, you will need to have a few credentials setup for VCR to work properly.
We will also add credentials for AWS, KYC2020, SmartyStreets, FontAwesome and E2E Cypress tests

```bash
vim ~/.zshenv
```

Add the following line with appropriate credentials from LastPass Shared-Dev Environment
```
# Project locations
export BASE_PROJECTS_DIR="/Users/<username>/Work/"
export ZT_DIR="${BASE_PROJECTS_DIR}/zetatango"
export RR_DIR="${BASE_PROJECTS_DIR}/roadrunner"
export FH_DIR="${BASE_PROJECTS_DIR}/foghorn"
export WE_DIR="${BASE_PROJECTS_DIR}/wile_e"
export DISABLE_RECAPTCHA=true
export ZT_SANDBOX=true
export THIRD_PARTY_CALLS_ENABLED=true

# Enable VCR for third party service calls
export VCR_CALLS_ENABLED=true
export VCR_CLOUD_CALLS_ENABLED=true

# KYC2020
export KYC2020_API_KEY="<LastPass KYC2020 API Key>"
export KYC2020_EMAIL="<LastPass KYC2020 Email>"

# SmartyStreets
export SMARTYSTREETS_CLIENT_ID="<LastPass Client ID>"
export SMARTYSTREETS_CLIENT_SECRET="<LastPass Client Secret>"

# INTERCOM API
INTERCOM_APP_ID=douc04vn

# AWS API keys
export AWS_S3_VCR_BUCKET="<LastPass S3 VCR Bucket>"
export AWS_REGION="<LastPass AWS Region>"
export AWS_ACCESS_KEY_ID="<LastPass AWS Access Key ID>"
export AWS_ACCESS_KEY="<LastPass AWS Access Key>"
export AWS_S3_BUCKET_STATIC_ASSETS="ario-static-assets-local-env"

# FontAwesome Auth
export FONTAWESOME_NPM_AUTH_TOKEN="<LASTPASS FORTAWESOME CREDS>"
```

Re-run zsh to load the settings
```
zsh
```

### Clone repository
Clone the repo to your machine. NOTE: use ssh only, https doesn't seem to work.

First time through you'll need to [setup ssh keys for github](https://help.github.com/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent/).
```
git clone git@github.com:Zetatango/foghorn.git
```
