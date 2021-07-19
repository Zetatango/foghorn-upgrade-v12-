import Chainable = Cypress.Chainable;

class SignInPage {
  fillEmail(value: string): void {
    cy.get('#user_email').clear().type(value, { delay: 0 }).should('have.value', value);
  }

  clearEmail(): void {
    cy.get('#user_email').clear().should('have.value', '');
  }

  fillPassword(value: string): void {
    cy.get('#user_password').clear().type(value, { delay: 0 }).should('have.value', value);
  }

  clearPassword(): void {
    cy.get('#user_password').clear().should('have.value', '');
  }

  login(): void {
    cy.get('#btn-sign-in').click();
  }

  getLoginError(): Chainable<JQuery<HTMLElement>> {
    return cy.get('.text-danger');
  }
}

export default  SignInPage;
