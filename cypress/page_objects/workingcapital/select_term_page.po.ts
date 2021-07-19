import Chainable = Cypress.Chainable;
class SelectTermPage {
  fillAmount(value: string): void {
    cy.log(value);
    cy.get('input[formcontrolname="amount"]').clear().type(value).should('have.value', `${value}`);
  }

  clearAmount(): void {
    cy.get('input[formcontrolname="amount"]').clear().should('have.value', '');
  }

  getNextButton(): Chainable<JQuery<HTMLElement>> {
    return cy.get('#select-offer-btn');
  }

  getErrorMessage(): Chainable<JQuery<HTMLElement>> {
    return cy.get('[formcontrolname="amount"] + .invalid-feedback');
  }
}

export default SelectTermPage;
