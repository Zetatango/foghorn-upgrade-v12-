import LeadsPage from '../../page_objects/internal/leads_page.po';

describe('Profile Transfer Flow', () => {
  const email = 'e2e-admin@arioplatform.com';
  const password: string = Cypress.env('E2E_ADMIN_PASSWORD');
  const leadsPage: LeadsPage = new LeadsPage();

  describe('Internal portal', () => {
    beforeEach(() => {
      cy.internalLogin(email, password);
    });

    describe('Leads upload', () => {
      beforeEach(() => {
        cy.navigateToLeads();
      });

      it.skip('should be able to upload leads CSV', () => {
        // New leads
        leadsPage.addNewLeads();
        leadsPage.leadsShowAdded(5);

        // Update leads
        leadsPage.updateLeads();
        leadsPage.leadsShowUpdated(5);

        // Malformed leads CSV
        leadsPage.uploadBadCsv();
        leadsPage.leadsShowError();
      });
    });
  });
});
