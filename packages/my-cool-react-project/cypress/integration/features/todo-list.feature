Feature: The Todo List should be displayed

  Scenario: Todo list should load
    As a User
    I want the todos to be loaded immediately when I land on page 1
    Because I want to see them.

    Given I'm a user who just went to the site
    When I let the page load
    Then I should see the todo list.