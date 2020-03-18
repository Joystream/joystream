Feature: Login & Logout

  Scenario: User should be able to login
    As a Non-Logged-In User
    I want to be able to login
    Because I want to know my userId.

    Given I'm a logged-out user on the home page
    When I click the "Login" button
    Then I should see my userId displayed
    And the "Login" button should be hidden
    And the "Logout" button should be displayed


  Scenario: User should be able to logout
    As a Logged-In User
    I want to be able to logout
    Because I want be no longer logged in.

    Given I'm a logged-in user on the home page
    When I click the "Logout" button
    Then my userId should be hidden
    And the "Logout" button should be hidden
    And the "Login" button should be displayed


  Scenario: Logged-In State Persists After Page Refresh
    As a Logged-In User
    I want to be able to refresh the page and stayed logged in
    Because it is very frustrating / bad UX for users to login after every page refresh. 

    Given I'm a logged-in user on the home page
    And I should see my userId displayed
    And the "Logout" button should be displayed
    When the page is refreshed
    Then my userId should still be displayed
    And the "Login" button should be hidden
    And the "Logout" button should be displayed