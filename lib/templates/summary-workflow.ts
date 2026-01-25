export function getWorkflowYaml(
  name: string,
  cron: string,
  scriptPath: string,
  apiUrl: string,
  tags: string[],
  period: "day" | "week"
): string {
  // Escape double quotes in name
  const safeName = name.replace(/"/g, '\\"');
  return `name: "${safeName}"

on:
  schedule:
    - cron: '${cron}'
  workflow_dispatch:

env:
  MARLIN_TAGS: "${tags.join(",")}"
  MARLIN_PERIOD: "${period}"
  MARLIN_API_KEY: \${{ secrets.MARLIN_API_KEY }}

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
        run: node ${scriptPath} --tags "$MARLIN_TAGS" --period "$MARLIN_PERIOD" --key "$MARLIN_API_KEY" --api-url "${apiUrl}"

      - name: Commit and push if changed
        run: |
          git config --global user.name 'github-actions[bot]'
          git config --global user.email 'github-actions[bot]@users.noreply.github.com'
          git add notes/Summary/
          git diff --quiet && git diff --staged --quiet || (git commit -m "chore: add daily summary" && git push)
`;
}
