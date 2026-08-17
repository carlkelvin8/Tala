import { expect, test } from "@playwright/test"

test("public authentication pages are accessible and do not overflow", async ({ page }) => {
  await page.goto("/login")
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible()
  await expect(page.getByLabel("Email or Student Number")).toBeVisible()
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

  await page.goto("/register")
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible()
  for (const label of ["First Name", "Last Name", "Student Number", "Email Address", "Password"]) {
    await expect(page.getByLabel(label, { exact: true })).toBeVisible()
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test("student can sign in and reach a responsive dashboard", async ({ page, request }) => {
  const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`
  const email = `e2e_${suffix}@test.local`
  const password = "StrongPassword123!"
  const registration = await request.post("http://127.0.0.1:4000/api/auth/register", {
    data: { email, password, role: "STUDENT", firstName: "E2E", lastName: "Student", studentNo: `E2E-${suffix}` },
  })
  expect(registration.ok()).toBe(true)

  await page.goto("/login")
  await page.getByLabel("Email or Student Number").fill(email)
  await page.getByLabel("Password", { exact: true }).fill(password)
  await page.getByRole("button", { name: "Sign in" }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole("heading", { name: /Welcome back/ })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
