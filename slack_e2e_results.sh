e2e_results=$(grep -i fail log/e2e_*.log)
curl -X POST -H 'Content-type: application/json' --data '{
    "attachments": [
        {
            "fallback": "Heroku E2E",
            "color": "#36a64f",
            "pretext": "Ario Platform Heroku E2E Results",
            "fields": [
                {
                    "title": "E2E Results",
                    "value": "'"${e2e_results}"'"
                }
            ]
        }
    ]
}' "${SLACK_DEVOPS_CHANNEL_URL}"