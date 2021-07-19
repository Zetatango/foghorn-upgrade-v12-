describe('IdP Portal', () => {
  const email = 'john.smith.idp' + new Date().getTime() + '@mail.com';
  const password: string = Cypress.env('E2E_ADMIN_PASSWORD');

  const kycStatus = {
    authentication: 'passed',
    confirmation_of_existence: 'passed',
    identity_verification: 'passed',
    ownership_verification: 'passed',
    watchlist: 'passed'
  };

  before(() => {
    cy.getAccessToken().then((response) => {
      cy.parseAccessToken(response.body).then((accessToken: { token: string }) => {
        cy.createConfirmedUserWithMerchantAndApplicant(accessToken.token, email, kycStatus).then((initResponse) => {
          expect(initResponse.status).to.equal(201);
        });
      });
    });
  });


  beforeEach(() => {
    cy.login(email, password);
    cy.get('#dropdown-user-menu').click();
    cy.get('a.dropdown-item')
      .first()
      .invoke('removeAttr', 'target')
      .click();
  });

  describe('Portal', () => {
    it('can access all header links', () => {
      cy.contains('Profile').click();
      cy.contains('Security').click();
      cy.contains('Activity').click();
    });
  });

  describe('Security', () => {
    it('can enable MFA with SMS', () => {
      cy.contains('Security').click();
      cy.contains('Enable MFA with SMS').click();
      cy.get('#sms_config_phone_number').type('+1 (613) 271-0744')
      cy.contains('Send SMS code').click();
      cy.contains('Enable').click();
      cy.contains('Ok, I\'ve copied my codes').click();
      cy.contains('Sign out').click();
    });

    it('can disable MFA', () => {
      cy.contains('Security').click();
      cy.contains('Disable MFA').click();
    });

    it('can update password and log in with new password', () => {
      const newPassword = `${password}1`;
      cy.contains('Security').click();
      cy.contains('Change password').click();
      cy.get('#user_current_password').type(password);
      cy.get('#user_password').type(newPassword);
      cy.contains('Update password').click();

      cy.contains('Sign out').click();
      cy.login(email, newPassword);
    });
  });
});
