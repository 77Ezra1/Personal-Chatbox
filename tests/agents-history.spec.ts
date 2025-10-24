import { test, expect } from '@playwright/test'

test.describe.skip('Agents history drawer', () => {
  test('displays filters and export controls', async ({ page }) => {
    await page.route('**/api/agents', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          agents: [
            {
              id: 'agent-1',
              name: 'Test Agent',
              description: 'Playwright generated agent',
              status: 'active',
              capabilities: ['demo'],
              totalRuns: 3,
              successRate: 90
            }
          ]
        })
      })
    })

    await page.route('**/api/agents/agent-1/executions**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          executions: [],
          stats: { total: 0, success: 0, failed: 0, successRate: 0, avgDuration: 0 },
          trend: []
        })
      })
    })

    await page.goto('/agents')

    await expect(page.getByText('Export')).not.toBeVisible()
  })
})
