import SignUpPage from '../../page_objects/roadrunner/sign_up_page.po';
import SignInPage from '../../page_objects/roadrunner/sign_in_page.po';

describe('IdP Sign up/Sign in', () => {
  const signInPage: SignInPage = new SignInPage();
  const signUpPage: SignUpPage = new SignUpPage();

  let users = [];
  const password: string = Cypress.env('E2E_ADMIN_PASSWORD');

  before(() => {
    cy.fixture('users').then((fixtureUsers) => {
      users = fixtureUsers;
      for (const user of users) {
        user.password = Cypress.env('E2E_ADMIN_PASSWORD');
      }
    });
  });

  describe('Merchant sign up', () => {
    beforeEach(() => {
      cy.signUp();
    });

    describe('error handling', () => {
      describe('simple client side input validation', () => {
        describe('initial state', () => {
          it('should have no invalid inputs', () => {
            signUpPage.isValid(cy.get('#user_first_name'));
            signUpPage.isValid(cy.get('#user_last_name'));
            signUpPage.isValid(cy.get('#user_email'));
            signUpPage.isValid(cy.get('#user_lead_phone_number'));
            signUpPage.isValid(cy.get('#user_password'));
          });

          it('should have submit button disabled', () => {
            signUpPage.isDisabled();
          });
        });

        describe('invalid first name', () => {
          it('should display error', () => {
            signUpPage.fillFirstName('a');
            signUpPage.clearFirstName();

            signUpPage.isInvalid(cy.get('#user_first_name'));
          });

          it('should display error with only whitespaces', () => {
            signUpPage.fillFirstName('   ');

            signUpPage.isInvalid(cy.get('#user_first_name'));
          });

          it('should be valid with name with spaces', () => {
            signUpPage.fillFirstName('M P');

            signUpPage.isValid(cy.get('#user_first_name'));
          });

          it('should disable form', () => {
            signUpPage.fillValidForm();
            signUpPage.clearFirstName();

            signUpPage.isDisabled();
          });
        });

        describe('invalid last name', () => {
          it('should display error', () => {
            signUpPage.fillLastName('a');
            signUpPage.clearLastName();

            signUpPage.isInvalid(cy.get('#user_last_name'));
          });

          it('should display error with only whitespaces', () => {
            signUpPage.fillLastName('   ');

            signUpPage.isInvalid(cy.get('#user_last_name'));
          });

          it('should be valid with name with spaces', () => {
            signUpPage.fillLastName('M P');

            signUpPage.isValid(cy.get('#user_last_name'));
          });

          it('should disable form', () => {
            signUpPage.fillValidForm();
            signUpPage.clearLastName();

            signUpPage.isDisabled();
          });
        });

        describe('invalid email', () => {
          it('should display error when empty', () => {
            signUpPage.fillEmail('a@a.com');
            signUpPage.clearEmail();

            signUpPage.isInvalid(cy.get('#user_email'));
          });

          it('should display error when invalid format', () => {
            signUpPage.fillEmail('a');

            signUpPage.isInvalid(cy.get('#user_email'));
          });

          it('should disable form', () => {
            signUpPage.fillValidForm();
            signUpPage.clearEmail();

            signUpPage.isDisabled();
          });
        });

        describe('invalid phone number', () => {
          it('should display error when empty', () => {
            signUpPage.fillPhoneNumber('(1');
            signUpPage.clearPhoneNumber();

            signUpPage.isInvalid(cy.get('#user_lead_phone_number'));
          });

          it('should display error when invalid format', () => {
            signUpPage.fillPhoneNumber('(613');
            signUpPage.isInvalid(cy.get('#user_lead_phone_number'));
          });

          it('should disable form', () => {
            signUpPage.fillValidForm();
            signUpPage.clearPhoneNumber();

            signUpPage.isDisabled();
          });
        });

        describe('invalid password', () => {
          it('should display error', () => {
            signUpPage.fillPassword('a');
            signUpPage.clearPassword();

            signUpPage.isInvalid(cy.get('#user_password'));
          });

          it('should disable form', () => {
            signUpPage.fillValidForm();
            signUpPage.clearPassword();

            signUpPage.isDisabled();
          });
        });
      });
    });

    describe('Password rules', () => {
      it('should update the password rule indicator when the length rule is satisfied', () => {
        signUpPage.getLengthRuleElement().should('not.have.class', 'text-success');
        signUpPage.fillPassword('12345678');
        signUpPage.getLengthRuleElement().should('have.class', 'text-success');
        signUpPage.isDisabled();
      });

      it('should update the password rule indicator when the length rule is satisfied', () => {
        signUpPage.getCommonRuleElement().should('not.have.class', 'text-success');
        signUpPage.fillPassword('Password4');
        signUpPage.getCommonRuleElement().should('have.class', 'text-success');
        signUpPage.isDisabled();
      });

      it('should update the password rule indicator when the complexity rule is satisfied', () => {
        signUpPage.getComplexityRuleElement().should('not.have.class', 'text-success');
        signUpPage.fillPassword('1A2b3C4d');
        signUpPage.getComplexityRuleElement().should('have.class', 'text-success');
        signUpPage.isDisabled();
      });
    });

    describe('Successful sign up', () => {
      afterEach(() => {
        cy.clearEmails();
      });

      it('should successfully submit sign up form and confirm email', () => {
        const email = `john.smith.signup${Date.now()}@mail.com`;
        signUpPage.fillFirstName(users[0].first_name);
        signUpPage.fillLastName(users[0].last_name);
        signUpPage.fillEmail(email);
        signUpPage.fillPhoneNumber(users[0].phone_number);
        signUpPage.fillPassword(users[0].password);
        signUpPage.signUp();

        cy.confirmUserEmail();
      });
    });
  });

  describe('Merchant sign in', () => {
    const email = `john.smith.signin${Date.now()}@mail.com`;

    before(() => {
      cy.getAccessToken().then((response) => {
        cy.parseAccessToken(response.body).then((accessToken: Record<string, unknown>) => {
          cy.createConfirmedUser(accessToken['token'], email).then((initResponse) => {
            expect(initResponse.status).to.equal(201);
          });
        });
      });
    });

    beforeEach(() => {
      cy.signIn();
    });

    describe('error handling', () => {
      it('should display error if username is blank', () => {
        signInPage.clearEmail();
        signInPage.fillPassword(password);
        signInPage.login();
        signInPage.getLoginError().should('exist').contains('Invalid Email, Identity provider or password.');
      });

      it('should display error if password is blank', () => {
        signInPage.fillEmail(email);
        signInPage.clearPassword();
        signInPage.login();
        signInPage.getLoginError().should('exist').contains('Invalid Email, Identity provider or password.');
      });

      it('should display error if password is incorrect', () => {
        signInPage.fillEmail(email);
        signInPage.fillPassword('WrongP@$$w0rd');
        signInPage.login();
        signInPage.getLoginError().should('exist').contains('Invalid Email, Identity provider or password.');
      });
    });

    describe('Successful login', () => {
      it('should be presented with About Your Business onboarding form', () => {
        signInPage.fillEmail(email);
        signInPage.fillPassword(password);
        signInPage.login();

        cy.contains('ABOUT YOUR BUSINESS');
      });
    });
  });
});
