import LenderPortal from '../../page_objects/workingcapital/lender_portal.po';

describe('Line of Credit Flow', () => {
  const LOC_PRODUCT_DESCRIPTION = 'LOC Config'

  describe('submit LOC request', () => {
    const email = 'john.smith.if' + new Date().getTime() + '@mail.com';
    const password: string = Cypress.env('E2E_ADMIN_PASSWORD');

    let merchant_id = "";

    before(() => {
      const kycStatus = {
        authentication: 'passed',
        confirmation_of_existence: 'passed',
        identity_verification: 'failed',
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
          cy.switchProductConfigurations(accessToken['token'], [LOC_PRODUCT_DESCRIPTION]).then((initResponse) => {
            expect(initResponse.status).to.equal(201);
          });
        });
      });

      cy.getAccessToken().then((response) => {
        cy.parseAccessToken(response.body).then((accessToken) => {
          cy.createConfirmedUserWithMerchantAndApplicant(<string>accessToken['token'], email, kycStatus, bankAccountParams).then((initResponse) => {
            expect(initResponse.status).to.equal(201);
            merchant_id = initResponse['body']['merchant']['id'];
          });
        });
      });
    });

    it('should complete LOC access funds request and show KYC failed banner', () => {
      cy.login(email, password);
      cy.accessFunds('500');

      // Choose to withdraw funds
      cy.choosePayeeLoc();

      // Payment details
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

      cy.getAccessToken().then((response) => {
        cy.parseAccessToken(response.body).then((accessToken) => {
          cy.acceptApplication(accessToken['token'], merchant_id).then((initResponse) => {
            expect(initResponse.status).to.equal(201);
            cy.reload();
            cy.get('.alert').should('exist');
          });
        });
      });
      cy.logout();
    });
  });

  describe('approve LOC request', () => {

    let merchant_id = "";
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
    const lenderPortal: LenderPortal = new LenderPortal();
    let approvers = [];
    const MERCHANT_EMAIL_FILE = 'loc_user.txt';
    const email = 'john.smith.if' + new Date().getTime() + '@mail.com';
    const password: string = Cypress.env('E2E_ADMIN_PASSWORD');

    before(() => {
      cy.fixture('working_capital/approvers.json').then((fixtureUsers) => {
        approvers = fixtureUsers;
      });
    });

    it('should allow merchant to request LOC funds', () => {
      cy.getAccessToken().then((response) => {
        cy.parseAccessToken(response.body).then((accessToken) => {
          cy.createConfirmedUserWithMerchantAndApplicant(accessToken['token'], email, kycStatus, bankAccountParams).then((initResponse) => {
            expect(initResponse.status).to.equal(201);
            merchant_id = initResponse['body']['merchant']['id'];
            cy.writeFile(MERCHANT_EMAIL_FILE, JSON.stringify({ email: email, merchant_id: merchant_id }));
          });
        });
      });
      cy.login(email, password);
      cy.accessFunds('500');

      // Choose to withdraw funds
      cy.choosePayeeLoc();

      // Payment details
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

      cy.getAccessToken().then((response) => {
        cy.parseAccessToken(response.body).then((accessToken) => {
          cy.acceptApplication(accessToken['token'], merchant_id).then((initResponse) => {
            expect(initResponse.status).to.equal(201);
            cy.reload();
          });
        });
      });
      cy.logout();
    });

    it('should allow underwriter to request new signature', () => {
      cy.lenderLogin(approvers[1].email, approvers[1].password);
      lenderPortal.billmarketCampaign();
      lenderPortal.clickMerchant();
      lenderPortal.selectMerchant();

      // review, add note and record decision
      lenderPortal.underwriting();
      lenderPortal.requestReSign();
    });

    it('should allow merchant to re-sign application', () => {
      cy.readFile(MERCHANT_EMAIL_FILE).then((stateJSONString: string) => {
        const state = JSON.parse(stateJSONString);
        cy.login(state.email, password);

        // Review details
        cy.contains('You already started a financing request. Pick up where you left off.');
        cy.get('[data-ng-id="withdrawal.continue.button"]').scrollIntoView().click();

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

        cy.getAccessToken().then((response) => {
          cy.parseAccessToken(response.body).then((accessToken) => {
            cy.acceptApplication(accessToken['token'], state.merchant_id).then((initResponse) => {
              expect(initResponse.status).to.equal(201);
              cy.reload();
            });
          });
        });

        cy.logout();
      });
    });

    it('should allow first reviewer to confirm application', () => {
      cy.lenderLogin(approvers[0].email, approvers[0].password);
      lenderPortal.billmarketCampaign();
      lenderPortal.clickMerchant();
      lenderPortal.selectMerchant();

      // review, add note and record decision
      lenderPortal.underwriting();
      lenderPortal.startReview();
      lenderPortal.addNote('Approved!');
      lenderPortal.recordDecision();

      // confirm decision
      cy.get('.modal-title').should('be.visible');
      cy.get('.modal-title').should('contains.contain.text', 'Application underwriting');
      cy.get('.btn.btn-primary.submit-decision-button').click();
      cy.contains('Pending 2nd approver').should('be.visible');
      lenderPortal.signOut();
    });

    it('should allow second reviewer to approve application', () => {
      cy.lenderLogin(approvers[1].email, approvers[1].password);
      lenderPortal.billmarketCampaign();
      lenderPortal.clickMerchant();
      lenderPortal.selectMerchant();

      // review, add note and record decision
      lenderPortal.underwriting();
      lenderPortal.startReview();
      lenderPortal.addNote('Done!');
      lenderPortal.recordDecision();

      // confirm decision
      cy.get('.modal-title').should('be.visible');
      cy.get('.modal-title').should('contain.text', 'Application underwriting');
      cy.get('.btn.btn-primary.submit-decision-button').click();
    });
  });
});