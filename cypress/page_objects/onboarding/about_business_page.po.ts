import Chainable = Cypress.Chainable;
import WaitXHR = Cypress.WaitXHR;

class AboutBusinessPage {
  getValidationErrors(): Chainable<JQuery<HTMLElement>> {
    return cy.get('.invalid-feedback');
  }

  submitForm(): void {
    cy.contains('Next').click();
  }

  businessConfirmDialogPresent(): void {
    cy.get('.confirm-business-modal').should('be.visible');
    cy.contains('CONFIRM BUSINESS').should('be.visible');
  }

  businessNotFoundDialogPresent(): void {
    cy.get('.business-not-found-modal').should('be.visible');
    cy.contains('Verify the information provided').should('be.visible');
  }

  confirmCreateMerchant(): void {
    cy.route('POST', '/api/v1/merchants').as('createMerchant');
    this.businessNotFoundDialogPresent();

    cy.get('[data-ng-id="business-not-found-next"]').click();

    cy.wait('@createMerchant').then((xhr: WaitXHR) => {
      expect(xhr.status).to.equal(200);
    });
  }

  serverErrorDialogPresent(): void {
    cy.get('.error-modal').should('be.visible');
    cy.contains('Oops, something went wrong on our end').should('be.visible');
  }

  merchantExistsErrorDialogPresent(): void {
    cy.get('.error-modal').should('be.visible');
    cy.contains('Sorry, this business was previously registered using another email address.').should('be.visible');
  }

  selectBusinessNotFound(): void {
    this.businessConfirmDialogPresent();
    cy.get('[data-ng-id="select-business-not-found"]').click();
    cy.get('.modal-footer .btn-accent').click();
  }

  selectFirstBusiness(): void{
    this.businessConfirmDialogPresent();
    cy.get('[data-ng-id="select-business"]').click();
    cy.get('.modal-footer .btn-accent').click();
  }

  expectMerchantQueryResponse(name?: string): void {
    cy.wait('@merchantQuery').then((xhr: WaitXHR) => {
      expect(xhr.status).to.equal(200);
      const responseData = xhr.responseBody['data'].results;
      const expectedLength = name ? 1 : 0;
      expect(responseData.length).to.equal(expectedLength);
      if(expectedLength > 0){
        expect(responseData[0].name).to.equal(name);
      }
    });
  }

  expectMerchantSelectResponse(errorCode: number): void {
    cy.wait('@merchantSelect').then((xhr: WaitXHR) => {
      expect(xhr.status).to.equal(errorCode);
    });
  }

}

export default AboutBusinessPage;
