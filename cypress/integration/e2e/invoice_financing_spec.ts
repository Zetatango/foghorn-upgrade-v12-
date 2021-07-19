describe('Invoice Financing Flow', () => {
  const email = 'john.smith.if' + new Date().getTime() + '@mail.com';
  const password: string = Cypress.env('E2E_ADMIN_PASSWORD');

  const BM_PRODUCT_DESCRIPTION = "BillMarket config";

  describe('submit invoice financing', () => {
    before(() => {
      const bpEmail = 'john.smith.bp' + new Date().getTime() + '@mail.com';
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
      const businessPartnerParams = {
        client_ip_address: '127.0.0.1',
        requested_vanity: 'e2e' + new Date().getTime()
      };

      cy.getAccessToken().then((response) => {
        cy.parseAccessToken(response.body).then((accessToken) => {
          cy.switchProductConfigurations(accessToken['token'], [BM_PRODUCT_DESCRIPTION]).then((initResponse) => {
            expect(initResponse.status).to.equal(201);
          });
        });
      });

      cy.getAccessToken().then((response) => {
        cy.parseAccessToken(response.body).then((accessToken: Record<string, unknown>) => {
          cy.createConfirmedUserWithMerchantAndApplicant(accessToken['token'], bpEmail, kycStatus, bankAccountParams, businessPartnerParams)
            .then((initResponse) => {
            expect(initResponse.status).to.equal(201);
          });
        });
      });

      cy.getAccessToken().then((response) => {
        cy.parseAccessToken(response.body).then((accessToken: Record<string, unknown>) => {
          cy.createConfirmedUserWithMerchantAndApplicant(accessToken['token'], email, kycStatus, bankAccountParams).then((initResponse) => {
            expect(initResponse.status).to.equal(201);
          });
        });
      });

      cy.login(email, password);
    });

    it('should complete invoice financing successfully', () => {
      cy.accessFunds('500');


      // Payee, Invoice #, Account #
      cy.fillPayeeForm();

      // Invoice details
      cy.fillInvoiceForm();

      // Review details
      cy.contains('Review your financing details');
      cy.contains('Financing summary');
      cy.get('[data-ng-id="review-lending-app-next-btn"]').scrollIntoView().click();

      // Agreement
      cy.contains("You're almost there");
      cy.window().then((win) => {
        cy.stub(win, 'open').as('windowOpen');
      });
      cy.get('#lending-agreement-sign-btn').scrollIntoView().click();

      // This is currently the best we can do - i.e. confirm that a new window/tab was opened with the confirm_login path
      cy.get('@windowOpen').should('be.calledWith', '/confirm_login?reauth_return=application&locale=en');
      cy.window().then(() => {
        cy.stub();
      });
    });
  });
});
