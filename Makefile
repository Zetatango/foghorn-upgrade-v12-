.PHONY: show-help build start stop down nuke e2e \
	inspect-foghorn \
	inspect-roadrunner inspect-roadrunner-database \
	inspect-wile_e inspect-wile_e-database \
	inspect-zetatango inspect-zetatango_database \
	flush-redis

.DEFAULT_GOAL := show-help

show-help:
	@echo 'Available Commands:'
	@echo '  build | Build all containers (with cache).'
	@echo '  start | Starts all containers.'
	@echo '  stop | Stops all running containers.'
	@echo '  down | Stops containers, clears volumes & networks. If things are not working as expected, you likely want to run this command.'
	@echo '  nuke | Clears all images, containers, networks, and volumes. If all else fails, run this command.'
	@echo '  e2e | Starts containers in e2e mode (sets RAILS_ENV).'
	@echo '  run-e2e | Runs all e2e tests. Note: for this command to work, all containers must be running in e2e mode (i.e. make e2e).'
	@echo '  inspect-SERVICE | Runs bash inside the running service container.'
	@echo '  attach-SERVICE | attach local standard input, output, and error streams to the running service container.'
	@echo '  inspect-SERVICE-database | Runs psql in the dev database of the service.'
	@echo '  flush-redis | clears the redis cache.'

build:
	docker-compose --file docker-compose.yaml build

start:
	docker-compose --file docker-compose.yaml up --renew-anon-volumes

stop:
	docker stop `docker ps -aq`

down:
	docker-compose --file docker-compose.yaml down -v

nuke:
	- docker stop `docker ps -aq`
	- @echo 'Note: this may take a while'
	- docker system prune --all --volumes

e2e:
	- docker stop `docker ps -aq`
	- RAILS_ENV=e2e docker-compose --file docker-compose.yaml up --renew-anon-volumes

run-e2e:
	- docker-compose --file docker-compose.yaml exec foghorn /bin/bash -c "rails e2e; npm run e2e_headless"

inspect-foghorn:
	docker-compose --file docker-compose.yaml exec foghorn /bin/bash

attach-foghorn:
	docker attach --detach-keys="ctrl-\\" ario_docker_foghorn_1

inspect-roadrunner:
	docker-compose --file docker-compose.yaml exec roadrunner /bin/bash

attach-roadrunner:
	docker attach --detach-keys="ctrl-\\" ario_docker_roadrunner_1

inspect-roadrunner-database:
	docker-compose --file docker-compose.yaml exec database psql roadrunner_dev

inspect-wile_e:
	docker-compose --file docker-compose.yaml exec wile_e /bin/bash

attach-wile_e:
	docker attach --detach-keys="ctrl-\\" ario_docker_wile_e_1

inspect-wile_e-database:
	docker-compose --file docker-compose.yaml exec database psql wile_e_dev

inspect-zetatango:
	docker-compose --file docker-compose.yaml exec zetatango /bin/bash

attach-zetatango:
	docker attach --detach-keys="ctrl-\\" ario_docker_zetatango_1

inspect-zetatango-database:
	docker-compose --file docker-compose.yaml exec database psql zetatango_dev

flush-redis:
	docker-compose --file docker-compose.yaml exec redis redis-cli flushall
