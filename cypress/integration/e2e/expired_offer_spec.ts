describe('Expired Offer Flow', () => {
  describe('reactivate credit', () => {
    const email = 'john.smith.if' + new Date().getTime() + '@mail.com';
    const password: string = Cypress.env('E2E_ADMIN_PASSWORD');

    let merchant_id = "";

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
            merchant_id = initResponse['body']['merchant']['id'];
          });
        });
      });
      cy.login(email, password);
      cy.url().should('include', '/onboarding');
    });

    after(() => {
      cy.logout();
    })

    it('should reactivate credit without reconnecting bank account', () => {
      cy.getAccessToken().then((response) => {
        cy.parseAccessToken(response.body).then((accessToken) => {
          cy.recertify(accessToken['token'], merchant_id, 'expired').then((initResponse) => {
            expect(initResponse.status).to.equal(201);
            cy.reload();
            cy.wait(500);
            cy.get('div[id=ztt-dashboard-data-list]').should('be.visible');
          });
        });
      });
      cy.reactivate();
    });
  });

  describe('reconnect and reactivate credit', () => {
    const email = 'john.smith.if' + new Date().getTime() + '@mail.com';
    const password: string = Cypress.env('E2E_ADMIN_PASSWORD');

    let merchant_id = "";

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
        institution_number: '777',
        transit_number: '12345',
        source: 'flinks'
      };

      cy.getAccessToken().then((response) => {
        cy.parseAccessToken(response.body).then((accessToken) => {
          cy.createConfirmedUserWithMerchantAndApplicant(accessToken['token'], email, kycStatus, bankAccountParams).then((initResponse) => {
            expect(initResponse.status).to.equal(201);
            merchant_id = initResponse['body']['merchant']['id'];
          });
        });
      });
      cy.login(email, password);
      cy.url().should('include', '/onboarding');
    });

    after(() => {
      cy.logout();
    })

    it('should reactivate credit by reconnecting bank account', () => {
      cy.getAccessToken().then((response) => {
        cy.parseAccessToken(response.body).then((accessToken) => {
          cy.get('div[id=ztt-dashboard-data-list]').should('be.visible');
          cy.recertify(accessToken['token'], merchant_id, 'expired', 'reconnect').then((recertifyResponse) => {
            expect(recertifyResponse.status).to.equal(201);
            cy.reload();
            cy.get('div[id=ztt-dashboard-data-list]').should('be.visible');
            cy.wait(500);
          });
        });
      });
      cy.reconnectBankAccount();
    });
  });
});