# Set up Puma to Run with HTTPS in development

Puma must be accessible over HTTPS for certain functionality to work in local development, e.g., Connect to Facebook. To setup Puma to accept HTTPS connections perform the following:

```
openssl req -x509 -sha256 -nodes -newkey rsa:2048 -days 365 -keyout localhost.key -out localhost.crt
```

Set HTTPS environment variables:

```
WLMP_USE_SSL=true
WLMP_SSL_KEY_PATH=<path to localhost.key generated in previous step>
WLMP_SSL_CERT_PATH=<path to localhost.crt generated in previous step>
```

Once you perform this configuration and start Puma, Puma will listen for HTTPS connections on port 3004.