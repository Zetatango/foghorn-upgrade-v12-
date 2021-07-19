# Docker
Note: For this setup to work, you should have cloned the foghorn, roadrunner, wile_e, and zetatango repos all under the same parent folder as such
```
parent_folder/
├── foghorn/
├── roadrunner/
├── wile_e/
└── zetatango/
```

#### Docker for Mac Installation Instructions
1. Uninstall virtualbox if you have virtualbox version `<=4.3.30`
2. Create account on https://hub.docker.com
3. Log into the docker hub with your account
4. Download [Docker for mac](https://hub.docker.com/editions/community/docker-ce-desktop-mac)
5. Open up the `.dmg` file, and do the usual drag to install
6. `CMD + Space`, type docker, press `Enter`
7. Follow the setup instructions (provide computer password for privileged access, log in with your docker id, etc.)
8. Type `docker` and `docker-compose` from a terminal to check that the programs are installed
9. (recommended) Give the VM more RAM: (menu bar) > Docker > preferences

#### Docker Environment Setup
Note: This part assumes that environment variables and your `/etc/hosts` file have already been updated. If you haven't performed those steps, ask another employee for help with those steps.

To clone private gems from within docker containers, you will need to set up some environment variables.

For Ario private repositories:

1. Navigate to the github [access tokens page](https://github.com/settings/tokens)
2. Click `generate new token`
3. Tick the `repo` checkbox
4. Click `generate token` at the bottom of the page
5. Copy the access token
6. Set the `BUNDLE_GITHUB__COM` environment variable to your access token with the following format `BUNDLE_GITHUB__COM=abcd0123generatedtoken:x-oauth-basic`.
If your environment variables are defined in `~/.bash_profile`, you can do this by adding the following line: `export BUNDLE_GITHUB__COM=abcd0123generatedtoken:x-oauth-basic`.

For rapid rails themes:

1. Go on lastpass, and get credentials for rapid rails themes.
2. Set the `BUNDLE_GEMS__RAPIDRAILSTHEMES__COM` environment variable to those credentials with the following format: `name%40domain.com:password`.
If your environment variables are defined in `~/.bash_profile`, you can do this by adding the following line: `export BUNDLE_GEMS__RAPIDRAILSTHEMES__COM=name%40domain.com:password`.

### Docker Usage

**Disclaimer**: If you are using docker for local development, the database used inside your containers will be reset every time the containers are launched. This is set to change when we upgrade our codebase to rails 6.

Containers are managed from the root of the foghorn repository using the Makefile as a command helper. You can type `make` on a terminal at the root of the foghorn folder to see a list of helper commands with their short descriptions.

To use the containers, you must **first** build the images using the command `make build`. It is recommended that you run this command as frequently as possible for faster startup times, but with the current setup, you only _need_ to run it once, and then again every time the Dockerfiles are updated.

#### Usage for development & unit tests
Once you've built your images, you just have to run `make start`. This will launch the four services in docker containers. You can modify the code with your favourite text editor as you normally would. The only thing that will be different is that **emails will not open in a new tab**. You will still be able to see the emails at the following address in a browser: `localhost:3000/letter_opener`.

When it comes to running unit tests and using byebug, the usage is slightly different.

**Unit tests and byebug**
After you run `make start`, the code is running inside containers, you will need to hop into the container using the `make inspect-<service>` command. This will give you a terminal session inside the service's container. To exit the container, type `exit`.

example usage for zetatango:
```bash
    make start
    # open new terminal session
    make inspect-zetatango
    # run unit tests
    rails t
    exit
```

Byebug executes on the container's main process. Use `make attach-<service>` to connect the input and outputs of the container's main process to your current terminal window. This will allow you to interact with byebug. To detach from the service without stopping the container, use the following keyboard sequence `ctrl+\`.

#### Usage for e2e tests
For e2e tests, instead of running `make start`, you should run `make e2e`.
This will set up the containers with servers running in e2e mode.

After running `make e2e`, run `make run-e2e` to run api and ui tests.

example e2e usage:
```bash
    # run servers in e2e mode
    make e2e

    # then run the following line in a new terminal session
    make run-e2e
```

#### Other container utilities
- Occasionally, killing `make start` does not properly stop the running containers. Run `make stop` to stop all running containers on your system.
- To clear the redis cache, you can run `make flush-redis`
- To run `psql` in a running service's database, you can run `make inspect-<service>-database`
- To unmount and reset the volumes that are connected to the containers, run `make down`. Note: this will reset your containers' databases.
- To completely reset your docker environment, you can run `make nuke`. This shouldn't be needed. Try running `make down` first.
