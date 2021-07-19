class AuthenticateApplicantPage {
  equifaxErrorPresent(): void {
    cy.get('.error-modal').should('be.visible');
    cy.contains('Oops, something went wrong on our end.').should('be.visible');
  }

  submitForm(): void {
    cy.get('#verify-yourself-btn').click();
  }

  incorrectAnswersErrorVisible(): void {
    cy.contains('Your answers are incorrect. Try again!').scrollIntoView().should('be.visible');
  }
}

export default AuthenticateApplicantPage;
