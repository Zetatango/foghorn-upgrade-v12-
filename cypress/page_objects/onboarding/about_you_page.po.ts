import Chainable = Cypress.Chainable;

class AboutYouPage {
  getValidationErrors(): Chainable<JQuery<HTMLElement>> {
    return cy.get('.invalid-feedback');
  }

  sinRequiredDialogPresent(): void {
    cy.get('.enter-sin-modal').should('be.visible');
    cy.contains('No record found').should('be.visible');
  }

  unableToCertifyPresent(): void {
    cy.contains('We\'re having trouble verifying some of your information').should('be.visible');
  }

  addressErrorDialogPresent(): void {
    cy.get('.error-modal').should('be.visible');
    cy.contains('Invalid Address').should('be.visible');
  }

  phoneNumberErrorDialogPresent(phoneNumber: string): void {
    cy.get('.error-modal').should('be.visible');
    cy.contains('The phone number ' + phoneNumber + ' is invalid.').should('be.visible');
  }

  genericErrorDialogPresent(): void {
    cy.get('.error-modal').should('be.visible');
    cy.contains('Oops, something went wrong on our end').should('be.visible');
  }

  submitForm(): void {
    cy.contains('Next').click();
  }
}

export default AboutYouPage;
