import {
  EditAddressFormData,
  EditBusinessFormData,
  MerchantPut
} from 'ui-app/src/app/models/api-entities/merchant';

describe('Edit Merchant - Self Edit', () => {
  const password: string = Cypress.env('E2E_ADMIN_PASSWORD');

  let addresses = [];
  let businesses = [];
  let partialBusinesses = [];

  before(() => {
    cy.fixture('businesses').then((fixtureBusinesses: MerchantPut[]) => {
      businesses = fixtureBusinesses;
    });

    cy.fixture('partial_businesses').then((fixturePartialBusinesses: EditBusinessFormData[]) => {
      partialBusinesses = fixturePartialBusinesses;
    });

    cy.fixture('addresses').then((fixtureAddresses: EditAddressFormData[]) => {
      addresses = fixtureAddresses;
    });
  });

  describe('Failed confirmation of existence,', () => {
    const kycStatus = {
      authentication: 'passed',
      confirmation_of_existence: 'failed',
      identity_verification: 'passed',
      ownership_verification: 'passed',
      watchlist: 'passed'
    };

    describe('Complete update(merchant + address)', () => {
      const email = `john.smith.coe1${Date.now()}@mail.com`;
      before(() => {
        cy.getAccessToken().then((response) => {
          cy.parseAccessToken(response.body).then((accessToken: Record<string, unknown>) => {
            cy.createConfirmedUserWithMerchantAndApplicant(accessToken['token'], email, kycStatus, null, null, businesses[1]).then((initResponse) => {
              expect(initResponse.status).to.equal(201);
            });
          });
        });
      });

      beforeEach(() => {
        cy.login(email, password);
      });

      afterEach(() => {
        cy.logout();
      });

      it('should display current merchant names on dashboard', () => {
        cy.checkDashboardNames(businesses[1].doing_business_as);
      });

      it('should be able to fill/submit merchant modal', () => {
        cy.checkDashboardAlert('We verify your identity to make sure you are you - not someone pretending to be you.');
        cy.clickOnEditMerchantLink();
        cy.get('#ztt-edit-merchant').should('be.visible');
        cy.fillEditMerchantForm(businesses[0]);
        cy.get('#ztt-edit-merchant').should('not.exist');
        cy.checkDashboardAlert('Thank you for confirming your information.');
      });

      it('should change merchant details dashboard after updating', () => {
        cy.checkDashboardNames(businesses[0].doing_business_as);
      });
    });

    describe('address update', () => {
      const email = `john.smith.coe2${Date.now()}@mail.com`;
      before(() => {
        cy.getAccessToken().then((response) => {
          cy.parseAccessToken(response.body).then((accessToken: Record<string, unknown>) => {
            cy.createConfirmedUserWithMerchantAndApplicant(accessToken['token'], email, kycStatus, null, null, businesses[2]).then((initResponse) => {
              expect(initResponse.status).to.equal(201);
            });
          });
        });
      });

      beforeEach(() => {
        cy.login(email, password);
      });

      afterEach(() => {
        cy.logout();
      });

      it('should be able to fill/submit merchant modal', () => {
        cy.checkDashboardAlert('We verify your identity to make sure you are you - not someone pretending to be you.');
        cy.clickOnEditMerchantLink();
        cy.get('#ztt-edit-merchant').should('be.visible');
        cy.fillEditMerchantForm(addresses[0]);
        cy.get('#ztt-edit-merchant').should('not.exist');
        cy.checkDashboardAlert('Thank you for confirming your information.');
      });

      it('should NOT change merchant details dashboard after updating', () => {
        cy.checkDashboardNames(businesses[2].doing_business_as);
      });
    });

    describe('business update', () => {
      const email = `john.smith.coe3${Date.now()}@mail.com`;
      before(() => {
        cy.getAccessToken().then((response) => {
          cy.parseAccessToken(response.body).then((accessToken: Record<string, unknown>) => {
            cy.createConfirmedUserWithMerchantAndApplicant(accessToken['token'], email, kycStatus, null, null, businesses[3]).then((initResponse) => {
              expect(initResponse.status).to.equal(201);
            });
          });
        });
      });

      beforeEach(() => {
        cy.login(email, password);
      });

      afterEach(() => {
        cy.logout();
      });

      it('should be able to fill/submit merchant modal', () => {
        cy.checkDashboardAlert('We verify your identity to make sure you are you - not someone pretending to be you.');
        cy.clickOnEditMerchantLink();
        cy.get('#ztt-edit-merchant').should('be.visible');
        cy.fillEditMerchantForm(partialBusinesses[0]);
        cy.get('#ztt-edit-merchant').should('not.exist');
        cy.checkDashboardAlert('Thank you for confirming your information.');
      });

      it('should change merchant details dashboard after updating', () => {
        cy.checkDashboardNames(partialBusinesses[0].doing_business_as);
      });
    });
  });

  describe('Failed KYC (other than confirmation of existence)', () => {
    const email = `john.smith.kyc${Date.now()}@mail.com`;
    const kycStatus = {
      authentication: 'passed',
      confirmation_of_existence: 'passed',
      identity_verification: 'failed',
      ownership_verification: 'failed',
      watchlist: 'failed'
    };

    before(() => {
      cy.getAccessToken().then((response) => {
        cy.parseAccessToken(response.body).then((accessToken: Record<string, unknown>) => {
          cy.createConfirmedUserWithMerchantAndApplicant(accessToken['token'], email, kycStatus).then((initResponse) => {
            expect(initResponse.status).to.equal(201);
          });
        });
      });
    });

    beforeEach(() => {
      cy.login(email, password);
    });

    afterEach(() => {
      cy.logout();
    });

    it('should not display an alert banner notifying the user that KYC failed and recommending to start a chat', () => {
      cy.get('.alert').should('not.exist');
    });
  });
});
