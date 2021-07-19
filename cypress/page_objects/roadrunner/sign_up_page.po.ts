import Chainable = Cypress.Chainable;

class SignUpPage {
  fillEmail(value: string): void {
    cy.get('#user_email')
      .clear()
      .type(value, { delay: 0 })
      .should('have.value', value)
      .blur();
  }

  clearEmail(): void {
    cy.get('#user_email')
      .clear()
      .should('have.value', '')
      .blur();
  }

  fillFirstName(value: string): void {
    cy.get('#user_first_name')
      .clear()
      .type(value, { delay: 0 })
      .should('have.value', value)
      .blur();
  }

  fillLastName(value: string): void {
    cy.get('#user_last_name')
      .clear()
      .type(value, { delay: 0 })
      .should('have.value', value)
      .blur();
  }

  fillName(value: string): void {
    cy.get('#user_name')
        .clear()
        .type(value, { delay: 0 })
        .should('have.value', value)
        .blur();
  }

  clearFirstName(): void {
    cy.get('#user_first_name')
      .clear()
      .should('have.value', '')
      .blur();
  }

  clearLastName(): void {
    cy.get('#user_last_name')
      .clear()
      .should('have.value', '')
      .blur();
  }

  clearName(): void {
    cy.get('#user_name')
      .clear()
      .should('have.value', '')
      .blur();
  }

  fillPhoneNumber(value: string): void {
    cy.get('#user_lead_phone_number')
      .clear()
      .type(value, { delay: 0 })
      .should('have.value', value)
      .blur();
  }

  clearPhoneNumber(): void {
    cy.get('#user_lead_phone_number')
      .clear()
      .clear()
      .should('have.value', '')
      .blur();
  }

  fillPassword(value: string): void {
    cy.get('#user_password')
      .clear()
      .type(value, { delay: 0 })
      .should('have.value', value)
      .blur();
  }

  clearPassword(): void {
    cy.get('#user_password')
      .clear()
      .should('have.value', '')
      .blur();
  }

  isInvalid(element: Chainable<JQuery<HTMLElement>>): void {
    element.should('have.css', 'border-bottom', '2px solid rgb(255, 0, 0)');
  }

  isValid(element: Chainable<JQuery<HTMLElement>>): void {
    element.should('not.have.css', 'border-bottom', '2px solid rgb(255, 0, 0)');
  }

  fillValidForm(): void {
    this.fillFirstName('First');
    this.fillLastName('Last');
    this.fillEmail('test@test.com');
    this.fillPhoneNumber('(613) 613-6133');
    this.fillPassword('Password111');
  }

  fillValidFormCfa(): void {
    this.fillName('First');
    this.fillEmail('test@test.com');
    this.fillPassword('abc1234');
  }

  signUp(): void {
    this.getSignUpButton().click();
  }

  getSignUpButton(): Chainable<JQuery<HTMLElement>> {
    return cy.get('#btn-sign-up');
  }

  getError(): Chainable<JQuery<HTMLElement>> {
    return cy.get('.text-danger');
  }

  getLengthRuleElement(): Chainable<JQuery<HTMLElement>> {
    return cy.get('[data-js-id="length-rule-check"]');
  }

  getComplexityRuleElement(): Chainable<JQuery<HTMLElement>> {
    return cy.get('[data-js-id="complexity-rule-check"]');
  }

  getCommonRuleElement(): Chainable<JQuery<HTMLElement>> {
    return cy.get('[data-js-id="common-rule-check"]');
  }

  isDisabled(): Chainable<JQuery<HTMLElement>> {
    return this.getSignUpButton().should('be.disabled');
  }
}

export default SignUpPage;
