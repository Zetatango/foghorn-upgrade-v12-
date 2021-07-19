import DashboardPage from '../../page_objects/dashboard_page.po';

describe('Dashboard Flow', () => {
  const email = 'john.smith.dash' + new Date().getTime() + '@mail.com';
  const password: string = Cypress.env('E2E_ADMIN_PASSWORD');

  const BM_PRODUCT_DESCRIPTION = "BillMarket config";
  const WCA_PRODUCT_DESCRIPTION = "WCA Config"

  const dashboardPage: DashboardPage = new DashboardPage();

  before(() => {
    const kycStatus = {
      authentication: 'passed',
      confirmation_of_existence: 'passed',
      identity_verification: 'passed',
      ownership_verification: 'passed',
      watchlist: 'passed'
    };
    cy.getAccessToken().then((response) => {
      cy.parseAccessToken(response.body).then((accessToken) => {
        cy.switchProductConfigurations(accessToken['token'], [WCA_PRODUCT_DESCRIPTION, BM_PRODUCT_DESCRIPTION]).then((initResponse) => {
          expect(initResponse.status).to.equal(201);
        });
      });
    });

    cy.getAccessToken().then((response) => {
      cy.parseAccessToken(response.body).then((accessToken: Record<string, unknown>) => {
        cy.createConfirmedUserWithMerchantAndApplicant(accessToken['token'], email, kycStatus).then((initResponse) => {
          expect(initResponse.status).to.equal(201);
        });
      });
    });

    cy.login(email, password);
  });

  after(() => {
    cy.logout();
  })

  it('should have working navigation bar', () => {
    cy.clickOnUploadDocuments();
    dashboardPage.onDocumentsPage();

    cy.clickOnBecomeAPartner();
    dashboardPage.onBecomeAPartnerPage();

    cy.clickOnMyBusiness();
    dashboardPage.onDashboardPage();

    cy.clickOnCashFlowAdvisor();
    dashboardPage.onCashFlowAdvisorPage();
  });
});
