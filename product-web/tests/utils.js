import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function loadUsers() {
  const file = path.resolve(__dirname, '../../product-api/users.txt')
  const rows = fs.readFileSync(file, 'utf-8').trim().split('\n')
  const users = {}

  rows.forEach((row) => {
    const parts = Object.fromEntries(
      row.split(';').map((segment) => {
        const [key, value] = segment.trim().split('=')
        return [key, value]
      }),
    )
    users[parts.role] = users[parts.role] || []
    users[parts.role].push({ email: parts.email, password: parts.password })
  })

  return users
}

export async function login(page, user) {
  await page.goto('/login')
  await page.getByPlaceholder('example@mail.ru').fill(user.email)
  await page.getByPlaceholder('Введите пароль').fill(user.password)
  await page.getByRole('button', { name: 'Войти' }).click()
  await page.waitForURL('**/dashboard')
}
