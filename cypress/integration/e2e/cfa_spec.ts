describe('CFA Flow', () => {
  const email = 'john.smith.if' + new Date().getTime() + '@mail.com';
  const password: string = Cypress.env('E2E_ADMIN_PASSWORD');

  before(() => {
    const kycStatus = {
      authentication: 'passed',
      confirmation_of_existence: 'passed',
      identity_verification: 'passed',
      ownership_verification: 'passed',
      watchlist: 'passed'
    };

    const bankAccountParams = {
      account_number: '12345678',
      institution_number: '123',
      transit_number: '12345'
    };

    cy.getAccessToken().then((response) => {
      cy.parseAccessToken(response.body).then((accessToken) => {
        cy.createConfirmedUserWithMerchantAndApplicant(accessToken['token'], email, kycStatus, bankAccountParams).then((initResponse) => {
          expect(initResponse.status).to.equal(201);
        });
      });
    });
  });

  beforeEach(() => {
    cy.login(email, password);
  });

  after(() => {
    cy.logout();
  })

  describe('Dashboard when CFA customer and supported bank accounts', () => {
    it('redirect to CFA error page when error getting data', () => {
      cy.clickOnCashFlowAdvisor();
      cy.toggleBusinessInsights();
      cy.contains('We are experiencing difficulties retrieving your data');
    });
  });

  it.skip('should successfully set a threshold', () => {
    cy.clickOnCashFlowAdvisor();
    cy.toggleBusinessInsights();
    cy.setMinimumCashReserves('4000');
    cy.contains('Successfully updated.');
  });

  it.skip('should display an error message due to invalid input', () => {
    cy.clickOnCashFlowAdvisor();
    cy.setMinimumCashReserves('1000.');
    cy.contains('Unable to update. Please try again.');
  });

  it.skip('should have an empty textbox because letters were entered', () => {
    cy.clickOnCashFlowAdvisor();
    cy.setMinimumCashReservesOnInvalidInput('test');
  });
});
