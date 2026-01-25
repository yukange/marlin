export function getWorkflowYaml(
  cron: string,
  scriptPath: string,
  apiUrl: string,
  tags: string[],
  period: "day" | "week"
): string {
  return `name: Periodic AI Summary

on:
  schedule:
    - cron: '${cron}'
  workflow_dispatch:

jobs:
  summarize:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm install gray-matter

      - name: Run summary script
        run: node ${scriptPath} --tags "${tags.join(",")}" --period "${period}" --key \${{ secrets.MARLIN_API_KEY }} --api-url "${apiUrl}"
        env:
          MARLIN_API_KEY: \${{ secrets.MARLIN_API_KEY }}

      - name: Commit and push if changed
        run: |
          git config --global user.name 'github-actions[bot]'
          git config --global user.email 'github-actions[bot]@users.noreply.github.com'
          git add notes/Summary/
          git diff --quiet && git diff --staged --quiet || (git commit -m "chore: add daily summary" && git push)
`;
}
