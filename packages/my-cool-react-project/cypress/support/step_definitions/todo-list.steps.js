import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps'

Given("I'm a user who just went to the site", () => {
  cy.visit('http://localhost:8000/')
})

When('I let the page load', inputText => {
  return // cypress waits for page to load automatically.
})

Then('I should see the todo list.', expected => {
  const firstTodoHeader = cy.get('h1:contains(First Thing)')
  const firstTodoDescription = cy.get(
    'p:contains(This is a very interesting description.)'
  )
  const secondTodoHeader = cy.get('h1:contains(Second Thing)')
  const secondTodoDescription = cy.get(
    'p:contains(This is a another interesting description.)'
  )

  firstTodoHeader.should('exist')
  firstTodoDescription.should('exist')
  secondTodoHeader.should('exist')
  secondTodoDescription.should('exist')
})
