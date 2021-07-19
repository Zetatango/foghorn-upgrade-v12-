# Contributing Process
In order to contribute/make changes to this project, the following process should be followed:

1. Work from a story / issue from GitHub - all work should be done from a required story/issue/task
2. Code changes are done in a separate branch.  i.e. you should start by creating a branch off of the latest master
```git checkout -b <new branch>```
3. Changes are added to git and committed to this branch
    ```
    git add <file>
    git add <file>
    git commit -m "short description of commit"
    ```
4. Add needed tests and ensure existing and new run successfully
```rails test```
5. When confident in changes, push to remote branch
6. Go to github and create a Pull request
7. Fill in required fields (Why? How? Risks?), create the PR and assign to developers
8. Code will need to be approved by 2+ developers
9. After 2 approvals, the code can be squashed and merged
10. If you need to rebase:
    ```
    git checkout master
    git pull
    git checkout -
    git rebase master
    ... resolve conflicts and add files to git
    git rebase --continue (if needed)
    git push --force
    ```
11. After Squash and Merge, keep an eye on your email for test, rubocop, brakeman and/or code coverage failures.  If all goes well, the code will auto deploy to Sandbox where you can/should verify the changes are working as expected.

After pushing to master, the code will go through CircleCI (to run test suite), codecov, rubocop (style checker), brakeman (for vulnerabilities). Assuming those pass, the code will autodeploy to the Sandbox environment - If there is an error, you need to go fix it, and go through and update the PR and push again, etc.