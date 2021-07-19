# Adding support for new partners

When adding a new partner to zetatango you must register their vanity URL in your local hosts file in order for the WLMP to function correctly.

As an example, if you add a partner with vanity `acme` append the following entry to 127.0.0.1 address in your 'etc/hosts' file:

```
127.0.0.1 localhost acme.zetatango.local
```

As a general rule, if you add a partner with vanity `<vanity_url>` add the following entry to your hosts file:

```
127.0.0.1 <vanity_url>.zetatango.local
```