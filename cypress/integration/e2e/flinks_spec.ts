describe.skip('Flinks banking flow', () => {
  let email: string;
  const password: string = Cypress.env('E2E_ADMIN_PASSWORD');

  beforeEach(() => {
    email = 'john.smith.flinks' + new Date().getTime() + '@mail.com';
    const kycStatus = {
      authentication: 'passed',
      confirmation_of_existence: 'passed',
      identity_verification: 'passed',
      ownership_verification: 'passed',
      watchlist: 'passed'
    };

    cy.getAccessToken().then((response) => {
      cy.parseAccessToken(response.body).then((accessToken: Record<string, unknown>) => {
        cy.createConfirmedUserWithMerchantAndApplicant(accessToken['token'], email, kycStatus).then((initResponse) => {
          expect(initResponse.status).to.equal(201);
        });
      });
    });

    cy.login(email, password);
  });

  it('should connect a bank account via Flinks', () => {
    cy.get('button').contains('Connect').click();
    cy.connectBankAccount('/dashboard');

    // Ensure we are back on the dashboard page by waiting for transactions to load
    cy.server();
    cy.route('GET', '/api/v1/transactions?limit=25&offset=0&order_by=created_at&order_direction=desc').as('getTxns');
    cy.wait('@getTxns');

    // Ensure that connect bank account button is no longer present
    cy.get('button').contains('Connect').should('not.exist');
  });
});
