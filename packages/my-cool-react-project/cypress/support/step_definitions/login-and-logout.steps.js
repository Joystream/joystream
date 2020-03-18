import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps'

Given("I'm a logged-out user on the home page", () => {
  cy.visit('http://localhost:8000/')
  cy.ensureUserIs('LoggedOut')
})

Given("I'm a logged-in user on the home page", () => {
  cy.visit('http://localhost:8000/')
  cy.ensureUserIs('LoggedIn')
})

When('I click the {string} button', buttonLabel => {
  cy.get(`button:contains(${buttonLabel})`).click()
})

When('the page is refreshed', buttonLabel => {
  cy.reload()
})

Then('I should see my userId displayed', () => {
  cy.verifyUserIdVisabilityIs(true)
})

Then('I should see my userId displayed', () => {
  cy.verifyUserIdVisabilityIs(true)
})

Then('the {string} button should be hidden', buttonLabel => {
  cy.get(`button:contains(${buttonLabel})`).should('not.visible')
})

Then('the {string} button should be displayed', buttonLabel => {
  cy.get(`button:contains(${buttonLabel})`).should('be.visible')
})

Then('my userId should be hidden', buttonLabel => {
  cy.verifyUserIdVisabilityIs(false)
})

Then('my userId should still be displayed', buttonLabel => {
  cy.verifyNewUserIdEqualsPreviousUserId()
})
