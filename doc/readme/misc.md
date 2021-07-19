# /etc/hosts
Append the address 'dev.zetatango.local' to the line containing 127.0.0.1 in your `/etc/hosts` file. For example:

```
127.0.0.1 localhost dev.zetatango.local
```

*Note:* Add ALL host forwarding to one line to avoid performance issues.
e.g. `127.0.0.1 sub1.zetatango.local sub2.zetatango.local sub3.zetatango.local`


# Troubleshooting

If having issues with buttons or fields not rendering, try, on ZTT and/or foghorn:
```
rake assets:precompile
```

# Clear Environment

To easily clear your environment (for the purposes of going through the flow again, you can set the following env variable: ZT_SANDBOX=true.  When that is enabled, under your user icon on the top right you should have the option to reset sandbox.

This will leave you with a clean environment where you can start over again.

# Puma Server Settings
Default Puma web concurrency on Puma server is 1 (in /config/puma.rb).  If you would like to enable Web Concurrency to have an environment closer to production you can set the environmental variable `WEB_CONCURRENCY` to 2 or more.  In production Heroku itself is setting this environmental variable based on the Dyno Sizes (minimum of 2 there).