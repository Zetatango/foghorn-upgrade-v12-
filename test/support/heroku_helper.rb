# frozen_string_literal: true

module HerokuHelper
  extend ActiveSupport::Concern

  def heroku_service_unavailable_html
    <<~HTML
      <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta charset="utf-8">
            <title>Application Error</title>
            <style media="screen">
              html,body,iframe {
                margin: 0;
                padding: 0;
              }
              html,body {
                height: 100%;
                overflow: hidden;
              }
              iframe {
                width: 100%;
                height: 100%;
                border: 0;
              }
            </style>
          </head>
          <body>
            <iframe src="https://s3.ca-central-1.amazonaws.com/static-maintenance-error-pages/error.html"></iframe>
          </body>
        </html>
    HTML
  end
end
