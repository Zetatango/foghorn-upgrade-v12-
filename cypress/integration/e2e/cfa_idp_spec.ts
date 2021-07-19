import SignUpPage from '../../page_objects/roadrunner/sign_up_page.po';

describe('CFA IdP Sign up', () => {
    const signUpPage: SignUpPage = new SignUpPage();

    let users = [];

    before(() => {
       cy.fixture('users').then((fixtureUsers) => {
           users = fixtureUsers;
           for (const user of users) {
               user.password = Cypress.env('E2E_ADMIN_PASSWORD');
           }
        })
    });

    describe('User sign up', () => {
       beforeEach(() => {
          cy.signUpCfa();
       });

       describe('error handling', () => {
          describe('simple client side input validation', () => {
             describe('initial state', () => {
                it('should have no invalid inputs', () => {
                    signUpPage.isValid(cy.get('#user_name'));
                    signUpPage.isValid(cy.get('#user_email'));
                    signUpPage.isValid(cy.get('#user_password'));
                });

                 it('should have submit button disabled', () => {
                     signUpPage.isDisabled();
                 });
             });

             describe('invalid business name', () => {
                 it('should display error', () => {
                     signUpPage.fillName('a');
                     signUpPage.clearName();

                     signUpPage.isInvalid(cy.get('#user_name'));
                 });

                 it('should display error with only whitespaces', () => {
                     signUpPage.fillName('   ');

                     signUpPage.isInvalid(cy.get('#user_name'));
                 });

                 it('should be valid with name with spaces', () => {
                     signUpPage.fillName('M P');

                     signUpPage.isValid(cy.get('#user_name'));
                 });

                 it('should disable form', () => {
                     signUpPage.fillValidFormCfa();
                     signUpPage.clearName();

                     signUpPage.isDisabled();
                 });
             });

             describe('invalid email', () => {
                 it('should display error when empty', () => {
                  signUpPage.fillEmail('b@b.com');
                  signUpPage.clearEmail();

                  signUpPage.isInvalid(cy.get('#user_email'));
                 });

                it('should display error when invalid format', () => {
                  signUpPage.fillEmail('a');

                  signUpPage.isInvalid(cy.get('#user_email'));
                });

                it('should disable form', () => {
                  signUpPage.fillValidFormCfa();
                  signUpPage.clearEmail();

                  signUpPage.isDisabled();
                });
            });

            describe('invalid password', () => {
              it('should display error', () => {
                  signUpPage.fillPassword('b');
                  signUpPage.clearPassword();

                  signUpPage.isInvalid(cy.get('#user_password'));
              });

              it('should disable form', () => {
                  signUpPage.fillValidFormCfa();
                  signUpPage.clearPassword();

                  signUpPage.isDisabled();
              });
            });
          });
       });

       describe('Password rules', () => {
           it('should update the password rule indicator when the length rule is satisfied', () => {
               signUpPage.getLengthRuleElement().should('not.have.class', 'text-success');
               signUpPage.fillPassword('12345679');
               signUpPage.getLengthRuleElement().should('have.class', 'text-success');
               signUpPage.isDisabled();
           });

           it('should update the password rule indicator when the length rule is satisfied', () => {
               signUpPage.getCommonRuleElement().should('not.have.class', 'text-success');
               signUpPage.fillPassword('Password5');
               signUpPage.getCommonRuleElement().should('have.class', 'text-success');
               signUpPage.isDisabled();
           });

           it('should update the password rule indicator when the complexity rule is satisfied', () => {
               signUpPage.getComplexityRuleElement().should('not.have.class', 'text-success');
               signUpPage.fillPassword('1A2b3C4b');
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
               signUpPage.fillName('John Co.');
               signUpPage.fillEmail(email);
               signUpPage.fillPassword(users[0].password);
               signUpPage.signUp();

               cy.confirmUserEmail();
           });
        });
    });
});
