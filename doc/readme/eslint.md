# ESLint
To lint all .ts files in foghorn/ui-app run:

`npm run lint`

To lint all 'non .spec' .ts files in foghorn/ui-app run:

`npm run lint_ts`

To lint all .spec.ts files in foghorn/ui-app run:

`npm run lint_spec`

For VS Code users who want to lint as you type:

[Install this extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) (Reload may be required)

Add the following to your settings.json. (This will highlight ESLint errors in the editor so long as foghorn is the root dir of the workspace.)

    "eslint.autoFixOnSave": true,
    "eslint.validate":  [
        {"language":  "typescript",  "autoFix":  true  }
    ]

