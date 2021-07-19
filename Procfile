release: bash release-tasks.sh
web: bundle exec puma -C config/puma.rb
worker: TERM_CHILD=1 RESQUE_PRE_SHUTDOWN_TIMEOUT=15 RESQUE_TERM_TIMEOUT=10 QUEUE=* rake resque:work
