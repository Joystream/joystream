// import loginStatuses as * from './../fixtures/loggedInStatuses'

// const loginStatuses = require('./../../fixtures/loggedInStatuses');
// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//

/**
 *  @param { enum { 'loggedIn': string, 'loggedOut': string }} loggedInStatus
 *
 *  Takes argument to decide when to check if user is "LoggedIn" or "LoggedOut".
 *
 *  (For checking LoggedIn) - If a button with the world "Logout" visible, click it.
 *  Otherwise, the user must already be logged out,
 *  so do nothing here and let it carry on with the rest of the test...
 *
 *  (For checking LoggedOut) - do the same as above but with "Login" button.
 */
Cypress.Commands.add('ensureUserIs', loggedInStatus => {
  const loginStatuses = {
    LoggedIn: 'LOGGED_IN',
    LoggedOut: 'LOGGED_OUT',
  }

  let buttonLabel = ''

  if (loginStatuses[loggedInStatus] === loginStatuses.LoggedIn) {
    buttonLabel = 'Login'
  } else if (loginStatuses[loggedInStatus] === loginStatuses.LoggedOut) {
    buttonLabel = 'Logout'
  } else {
    cy.fail('Whoops! Invalid loggedInStatus: ' + loggedInStatus)
  }

  cy.get('div#login-section').then($loginSection => {
    const children = Array.from($loginSection.children())

    children.forEach(childElement => {
      if (childElement.nodeName === 'BUTTON') {
        if (childElement.innerText === buttonLabel) {
          cy.get(`button:contains(${buttonLabel})`).click()
        }
      }
    })
  })
})

let previousUserId
Cypress.Commands.add('verifyUserIdVisabilityIs', expectedVisiblity => {
  cy.get('h2#userId-section').then(childElement => {
    const labelText = 'User Id: '
    const userIdBeginningIndex = childElement.text().indexOf(labelText)
    const userId = childElement
      .text()
      .substr(userIdBeginningIndex + labelText.length, 4)

    expect(!isNaN(parseInt(userId))).to.equal(expectedVisiblity)

    if (expectedVisiblity) {
      previousUserId = userId
    }
  })
})

Cypress.Commands.add('verifyNewUserIdEqualsPreviousUserId', () => {
  cy.get('h2#userId-section').then(childElement => {
    const labelText = 'User Id: '
    const userIdBeginningIndex = childElement.text().indexOf(labelText)
    const userId = childElement
      .text()
      .substr(userIdBeginningIndex + labelText.length, 4)

    expect(userId).to.equal(previousUserId)
  })
})
