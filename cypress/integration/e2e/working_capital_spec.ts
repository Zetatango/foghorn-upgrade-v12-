import WaitXHR = Cypress.WaitXHR;
import SelectTermPage from '../../page_objects/workingcapital/select_term_page.po';
import LenderPortal from '../../page_objects/workingcapital/lender_portal.po';

describe('Working Capital Flow', () => {
  const selectTermPage: SelectTermPage = new SelectTermPage();
  const minWcaPrincipalAmount = 500;
  const maxWcaPrincipalAmount = 300000;
  const email = 'john.smith.wca' + new Date().getTime() + '@mail.com';
  const password: string = Cypress.env('E2E_ADMIN_PASSWORD');
  const fileName = 'image.png';
  const FILE_MIME_TYPE = 'image/png';
  let approvers: Array<any>;
  const lenderPortal: LenderPortal = new LenderPortal();
  const MERCHANT_EMAIL_FILE = 'wca_user.txt';

  const WCA_PRODUCT_DESCRIPTION = "WCA Config"

  describe('apply for working capital successfully', () => {

    before(() => {
      cy.fixture('working_capital/approvers.json').then((fixtureUsers) => {
        approvers = fixtureUsers;
      });
    });

    it('should be able to submit the application successfully', () => {
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
          cy.switchProductConfigurations(accessToken['token'], [WCA_PRODUCT_DESCRIPTION]).then((initResponse) => {
            expect(initResponse.status).to.equal(201);
          });
        });
      });

      cy.getAccessToken().then((response) => {
        cy.parseAccessToken(response.body).then((accessToken: Record<string, unknown>) => {
          cy.createConfirmedUserWithMerchantAndApplicant(accessToken['token'], email, kycStatus, bankAccountParams).then((initResponse) => {
            expect(initResponse.status).to.equal(201);
            cy.writeFile(MERCHANT_EMAIL_FILE, email);
          });
        });
      });

      cy.login(email, password);

      cy.get('[data-ng-id="apply-for-offer-btn"]').contains('Get funded').click();

      // enter amount and go to next step
      cy.get('#amount').clear().type('10000.00').should('have.value', '10000.00');
      cy.get('#select-offer-btn').click();

      // upload supporting document
      cy.contains('Supporting documents for your business');
      cy.uploadFile(fileName, FILE_MIME_TYPE);
      cy.get('#docs-submit-btn').click();

      // confirmation
      cy.contains('Thanks for applying!');

      // Check the state is "in progress"
      cy.get('[data-ng-id="approval-pending-back-button"]').click();
      cy.get('[data-ng-id="apply-for-offer-spinner"]').contains('Your application is being reviewed');
    });

    it('should be able to approve the application as first reviewer', () => {
      cy.lenderLogin(approvers[0].email, approvers[0].password);
      lenderPortal.billmarketCampaign();
      lenderPortal.clickMerchant();
      lenderPortal.selectMerchant();

      // review, add note and record decision
      lenderPortal.underwriting();
      lenderPortal.sendToFirst();
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

    it('should be able to approve the application as second reviewer', () => {
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

      // verify email is sent when loan is approved
      cy.loanApprovalEmail();
      cy.clearEmails();
    });

    it('should be able to sign the agreement after approval', () => {
      cy.readFile(MERCHANT_EMAIL_FILE).then((wcaUserEmail: string) => {
        cy.login(wcaUserEmail, password);

        // click review & sign
        cy.get('[data-ng-id="apply-for-offer-btn"]').contains('Review & Sign').click();
        cy.get('.card-title.mb-0').contains('Review your financing details').should('be.visible');

        // proceed to next step
        cy.get('[data-ng-id="review-lending-app-next-btn"]').contains('Next').click();
        cy.contains('Review and sign the agreement below to submit your financing request.').should('be.visible');

        // click sign
        cy.window().then((win) => {
          cy.stub(win, 'open').as('windowOpen');
        });

        cy.get('#lending-agreement-sign-btn').scrollIntoView().click();
        cy.get('@windowOpen').should('be.calledWith', '/confirm_login?reauth_return=application&locale=en');
        cy.window().then(() => {
          cy.stub();
        });
      });
    });
  });

  describe('Applying for Working Capital Errors', () => {
    let wcaError;

    before(() => {
      cy.fixture('working_capital/error.json').then((fixtureWCAError) => {
        wcaError = fixtureWCAError;
      });
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
        cy.parseAccessToken(response.body).then((accessToken: Record<string, unknown>) => {
          cy.createConfirmedUserWithMerchantAndApplicant(accessToken['token'], email, kycStatus, bankAccountParams).then((initResponse) => {
            expect(initResponse.status).to.equal(201);
          });
        });
      });
    });

    beforeEach(() => {
      cy.login(email, password);
    });

    describe('Working Capital error handling', () => {
      it('error validation in select term page', () => {
        cy.clickOnApplyForWca();
        cy.url().should('include', 'application');

        // Default message validation
        selectTermPage.getErrorMessage().should('not.exist');
        selectTermPage.getNextButton().should('be.disabled');
        for (const amt of wcaError.amount) {
          selectTermPage.fillAmount(amt);
          if (amt >= minWcaPrincipalAmount && amt <= maxWcaPrincipalAmount) {
            selectTermPage.getErrorMessage().should('not.exist');
            selectTermPage.getNextButton().should('be.enabled');
          } else if (amt < minWcaPrincipalAmount) {
            selectTermPage.getErrorMessage().contains(`Minimum is $${minWcaPrincipalAmount}.`).should('be.visible');
            selectTermPage.getNextButton().should('be.disabled');
          } else if (amt > maxWcaPrincipalAmount) {
            selectTermPage.getErrorMessage().contains(`Maximum allowed is ${Number(maxWcaPrincipalAmount.toPrecision(8)).toLocaleString('en-US', { style: "currency", currency: "USD" })}.`).should('be.visible');
            selectTermPage.getNextButton().should('be.disabled');
          }
        }
      });

      it('should display generic error dialog if unknown error occurs', () => {
        cy.clickOnApplyForWca();
        cy.url().should('include', 'application');
        cy.server();
        cy.route({
          method: 'POST',
          url: '/api/v1/lending_applications',
          status: 500,
          response: {},
        }).as('createLendingApp');

        selectTermPage.fillAmount(wcaError.amount[0]);
        selectTermPage.getNextButton().should('be.enabled').click();

        cy.wait('@createLendingApp').then((xhr: WaitXHR) => {
          expect(xhr.status).to.equal(500);
        });
        cy.contains('Oops, something went wrong on our end.');
      });

      it('should display file upload error for incorrect format', () => {
        cy.clickOnApplyForWca();
        cy.url().should('include', 'application');

        selectTermPage.fillAmount(wcaError.amount[0]);
        selectTermPage.getNextButton().should('be.enabled').click();

        const errorFileName = 'working_capital/error.json';
        cy.uploadFile(errorFileName, 'application/json');
        cy.contains('The following file was not added');
      });
    });
  });
});
