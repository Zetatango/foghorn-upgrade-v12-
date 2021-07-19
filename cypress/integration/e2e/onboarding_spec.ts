import WaitXHR = Cypress.WaitXHR;

import AboutBusinessPage from '../../page_objects/onboarding/about_business_page.po';
import AboutYouPage from '../../page_objects/onboarding/about_you_page.po';
import AuthenticateApplicantPage from '../../page_objects/onboarding/authenticate_applicant_page.po';

describe('Onboarding Flow', () => {
  const aboutBusinessPage: AboutBusinessPage = new AboutBusinessPage();
  const aboutYouPage: AboutYouPage = new AboutYouPage();
  const authenticateApplicantPage: AuthenticateApplicantPage = new AuthenticateApplicantPage();

  const password: string = Cypress.env('E2E_ADMIN_PASSWORD');

  let applicants = [];
  let businesses = [];

  before(() => {
    cy.fixture('applicants').then((fixtureApplicants) => {
      applicants = fixtureApplicants;
    });

    cy.fixture('businesses').then((fixtureBusinesses) => {
      businesses = fixtureBusinesses;
    });
  });

  describe('About your business', () => {
    describe('Select merchant', () => {
      const email = `john.smith.biz${Date.now()}@mail.com`;

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
        cy.login(email, password);
        cy.contains('ABOUT YOUR BUSINESS');
      });

      describe('Error handling', () => {
        it('should display an appropriate error message for missing required fields', () => {
          aboutBusinessPage.getValidationErrors().should('not.be.visible');
          cy.fillAboutBusinessFormNoSelects(businesses[0]);
          cy.performAboutBusinessFormValidation(businesses[0]);
        });
      });

      describe('Submit form', () => {
        it('should display a warning that the business could not be found if no potential matches found', () => {
          cy.fillAboutBusinessForm(businesses[0]);

          cy.server();
          cy.route('POST', '/on_boarding/query_merchant', 'fixture:query_merchant/no_results.json').as('merchantQuery');

          aboutBusinessPage.submitForm();

          aboutBusinessPage.expectMerchantQueryResponse();

          aboutBusinessPage.businessNotFoundDialogPresent();
        });

        it('should display a warning that the business could not be found if the server returns an error', () => {
          cy.fillAboutBusinessForm(businesses[0]);

          cy.server();
          cy.route({
            method: 'POST',
            url: '/on_boarding/query_merchant',
            response: 'fixture:query_merchant/error.json',
            status: 500
          }).as('merchantQuery');

          aboutBusinessPage.submitForm();

          cy.wait('@merchantQuery').then((xhr: WaitXHR) => {
            expect(xhr.status).to.equal(500);
            const errorCode = xhr.responseBody['code'];
            expect(errorCode).to.equal(10001);
          });

          aboutBusinessPage.serverErrorDialogPresent();
        });

        it('should display error message if selected business already exists', () => {
          cy.fillAboutBusinessForm(businesses[0]);

          cy.server();
          cy.route('POST', '/on_boarding/query_merchant').as('merchantQuery');

          aboutBusinessPage.submitForm();

          aboutBusinessPage.expectMerchantQueryResponse(businesses[0].name);

          aboutBusinessPage.businessConfirmDialogPresent();

          cy.route({
            method: 'POST',
            url: '/on_boarding/select_merchant',
            response: 'fixture:select_merchant/merchant_exists_error.json',
            status: 409
          }).as('merchantSelect');
          
          aboutBusinessPage.selectFirstBusiness();

          aboutBusinessPage.expectMerchantSelectResponse(409);

          aboutBusinessPage.merchantExistsErrorDialogPresent();
        });

        it('should display generic error message if merchant select request fails', () => {
          cy.fillAboutBusinessForm(businesses[0]);

          cy.server();
          cy.route('POST', '/on_boarding/query_merchant').as('merchantQuery');

          aboutBusinessPage.submitForm();

          aboutBusinessPage.expectMerchantQueryResponse(businesses[0].name);

          aboutBusinessPage.businessConfirmDialogPresent();

          cy.route({
            method: 'POST',
            url: '/on_boarding/select_merchant',
            response: 'fixture:unknown_error.json',
            status: 500
          }).as('merchantSelect');
          
          aboutBusinessPage.selectFirstBusiness();

          aboutBusinessPage.expectMerchantSelectResponse(500);

          aboutBusinessPage.serverErrorDialogPresent();
        });

        it('should display business confirmation picker if potential match found and continue to About You when confirmed', () => {
          cy.fillAboutBusinessForm(businesses[0]);

          cy.server();
          cy.route('POST', '/on_boarding/query_merchant').as('merchantQuery');

          aboutBusinessPage.submitForm();

          aboutBusinessPage.expectMerchantQueryResponse(businesses[0].name);

          cy.route('POST', '/on_boarding/select_merchant').as('merchantSelect');
          aboutBusinessPage.selectFirstBusiness();

          aboutBusinessPage.expectMerchantSelectResponse(200);

          cy.contains('ABOUT YOU (BUSINESS OWNER)');
        });
      });
    });

    describe('Create merchant', () => {
        const email = `john.smith.no-biz${Date.now()}@mail.com`;
        before(() => {
          cy.getAccessToken().then((response) => {
            cy.parseAccessToken(response.body).then((accessToken: Record<string, any>) => {
              cy.createConfirmedUser(accessToken['token'], email).then((initResponse) => {
                expect(initResponse.status).to.equal(201);
              });
            });
          });
        });

        beforeEach(() => {
          cy.login(email, password);
          cy.contains('ABOUT YOUR BUSINESS');
        });

      it('should display business confirmation picker if potential match found and continue to About You when "My Business isn\'t listed"', () => {
          cy.fillAboutBusinessForm(businesses[0]);

          cy.server();
          cy.route('POST', '/on_boarding/query_merchant').as('merchantQuery');

          aboutBusinessPage.submitForm();

          aboutBusinessPage.expectMerchantQueryResponse(businesses[0].name);

          aboutBusinessPage.selectBusinessNotFound();

          aboutBusinessPage.confirmCreateMerchant();

          cy.contains('ABOUT YOU (BUSINESS OWNER)');
        });
      });
  });

  describe('About You', () => {
    const email = `john.smith.you${Date.now()}@mail.com`;

    before(() => {
      cy.getAccessToken().then((response) => {
        cy.parseAccessToken(response.body).then((accessToken: Record<string, unknown>) => {
          cy.createConfirmedUserWithMerchant(accessToken['token'], email).then((initResponse) => {
            expect(initResponse.status).to.equal(201);
          });
        });
      });
    });

    beforeEach(() => {
      cy.login(email, password);
      cy.contains('ABOUT YOU (BUSINESS OWNER)');
    });

    describe('Error handling', () => {
      it('should display an appropriate error message for missing required fields', () => {
        aboutYouPage.getValidationErrors().should('not.be.visible');
        cy.fillAboutYouFormNoSelectedProvince(applicants[0]);
        cy.performAboutYouFormValidation(applicants[0]);
      });
    });

    describe('Submit form', () => {
      it('should prompt for SIN if multiple matches found', () => {
        cy.fillAboutYouForm(applicants[0]);

        cy.server();
        cy.route({
          method: 'POST',
          url: '/on_boarding/submit_applicant',
          response: 'fixture:create_applicant/sin_required.json',
          status: 404
        }).as('createApplicant');

        aboutYouPage.submitForm();

        cy.wait('@createApplicant').then((xhr: WaitXHR) => {
          expect(xhr.status).to.equal(404);
          const errorCode = xhr.responseBody['code'];
          expect(errorCode).to.equal(60100);
        });

        aboutYouPage.sinRequiredDialogPresent();
      });

      it('should display unable to certify page if we fail to certify the applicant', () => {
        cy.fillAboutYouForm(applicants[0]);

        cy.server();
        cy.route({
          method: 'POST',
          url: '/on_boarding/submit_applicant',
          response: 'fixture:create_applicant/unable_to_certify.json',
          status: 404
        }).as('createApplicant');

        aboutYouPage.submitForm();

        cy.wait('@createApplicant').then((xhr: WaitXHR) => {
          expect(xhr.status).to.equal(404);
          const errorCode = xhr.responseBody['code'];
          expect(errorCode).to.equal(11001);
        });

        aboutYouPage.unableToCertifyPresent();
      });

      it('should display address error dialog if provided address does not match', () => {
        cy.fillAboutYouForm(applicants[0]);

        cy.server();
        cy.route({
          method: 'POST',
          url: '/on_boarding/submit_applicant',
          response: 'fixture:create_applicant/address_error.json',
          status: 422
        }).as('createApplicant');

        aboutYouPage.submitForm();

        cy.wait('@createApplicant').then((xhr: WaitXHR) => {
          expect(xhr.status).to.equal(422);
          const errorCode = xhr.responseBody['code'];
          expect(errorCode).to.equal(22000);
        });

        aboutYouPage.addressErrorDialogPresent();
      });

      it('should display phone number error dialog if provided phone number does not match', () => {
        cy.fillAboutYouForm(applicants[0]);

        cy.server();
        cy.route({
          method: 'POST',
          url: '/on_boarding/submit_applicant',
          response: 'fixture:create_applicant/phone_number_error.json',
          status: 422
        }).as('createApplicant');

        aboutYouPage.submitForm();

        cy.wait('@createApplicant').then((xhr: WaitXHR) => {
          expect(xhr.status).to.equal(422);
          const errorCode = xhr.responseBody['code'];
          expect(errorCode).to.equal(23000);
        });

        aboutYouPage.phoneNumberErrorDialogPresent(applicants[0].formatted_phone_number);
      });

      it('should display generic error dialog if unknown error occurs', () => {
        cy.fillAboutYouForm(applicants[0]);

        cy.server();
        cy.route({
          method: 'POST',
          url: '/on_boarding/submit_applicant',
          response: 'fixture:unknown_error.json',
          status: 500
        }).as('createApplicant');

        aboutYouPage.submitForm();

        cy.wait('@createApplicant').then((xhr: WaitXHR) => {
          expect(xhr.status).to.equal(500);
          const errorCode = xhr.responseBody['code'];
          expect(errorCode).to.equal(11001);
        });

        aboutYouPage.genericErrorDialogPresent();
      });

      it('should create the applicant and proceed to the authentication step (eID)', () => {
        cy.fillAboutYouForm(applicants[0]);

        cy.server();
        cy.route('POST', '/on_boarding/submit_applicant').as('createApplicant');

        aboutYouPage.submitForm();

        cy.wait('@createApplicant').then((xhr: WaitXHR) => {
          expect(xhr.status).to.equal(200);
          const responseData = xhr.responseBody['data'];
          expect(responseData.first_name).to.equal(applicants[0].first_name);
          expect(responseData.last_name).to.equal(applicants[0].last_name);
          expect(responseData.id).to.not.equal(null);
        });

        cy.route('POST', '/api/v1/applicants/*/authenticate').as('initAuthentication');
        cy.wait('@initAuthentication').then((xhr: WaitXHR) => {
          expect(xhr.status).to.equal(200);
          const responseData = xhr.responseBody['data'];
          expect(responseData.questions.length).to.be.greaterThan(0);
        });

        cy.contains('Verify yourself');
      });
    });
  });

  describe('Applicant authentication (eID)', () => {
    const email = `john.smith.auth${Date.now()}@mail.com`;

    before(() => {
      cy.getAccessToken().then((response) => {
        cy.parseAccessToken(response.body).then((accessToken: Record<string, unknown>) => {
          cy.createConfirmedUserWithMerchantAndApplicant(accessToken['token'], email).then((initResponse) => {
            expect(initResponse.status).to.equal(201);
          });
        });
      });
    });

    it('should display error dialog if error returned from Equifax on init request', () => {
      cy.server();
      cy.route({
        method: 'POST',
        url: '/api/v1/applicants/*/authenticate',
        response: 'fixture:authenticate_applicant/equifax_error.json',
        status: 503
      }).as('initAuthentication');

      cy.login(email, password);

      cy.wait('@initAuthentication').then((xhr: WaitXHR) => {
        expect(xhr.status).to.equal(503);
      });

      authenticateApplicantPage.equifaxErrorPresent();
      cy.dismissErrorDialog();
    });

    it('should redirect to the dashboard if init request fails', () => {
      cy.server();
      cy.route({
        method: 'POST',
        url: '/api/v1/applicants/*/authenticate',
        response: {},
        status: 400
      }).as('initAuthentication');

      cy.login(email, password);

      cy.wait('@initAuthentication').then((xhr: WaitXHR) => {
        expect(xhr.status).to.equal(400);
      });

      cy.contains('Processing information');
      cy.contains('Thank You! We are now processing your information.');

      cy.route('GET', '/api/v1/transactions?limit=25&offset=0&order_by=created_at&order_direction=desc').as('getTxns');
      cy.wait('@getTxns');

      cy.logout();
    });

    it('should display error if error returned from Equifax on authentication completion', () => {
      cy.server();
      cy.route('POST', '/api/v1/applicants/*/authenticate').as('initAuthentication');

      cy.login(email, password);

      cy.selectAuthenticationResponses();

      cy.route({
        method: 'PUT',
        url: '/api/v1/applicants/*/authenticate',
        response: 'fixture:authenticate_applicant/equifax_error.json',
        status: 503
      }).as('authenticate');

      authenticateApplicantPage.submitForm();

      cy.wait('@authenticate').then((xhr: WaitXHR) => {
        expect(xhr.status).to.equal(503);
      });

      authenticateApplicantPage.equifaxErrorPresent();
      cy.dismissErrorDialog();
    });

    it('should redirect to the dashboard if authenticate request fails', () => {
      cy.server();
      cy.route('POST', '/api/v1/applicants/*/authenticate').as('initAuthentication');

      cy.login(email, password);

      cy.selectAuthenticationResponses();

      cy.route({
        method: 'PUT',
        url: '/api/v1/applicants/*/authenticate',
        response: {},
        status: 422
      }).as('authenticate');

      authenticateApplicantPage.submitForm();

      cy.wait('@authenticate').then((xhr: WaitXHR) => {
        expect(xhr.status).to.equal(422);
      });

      cy.contains('Processing information');
      cy.contains('Thank You! We are now processing your information.');

      cy.route('GET', '/api/v1/transactions?limit=25&offset=0&order_by=created_at&order_direction=desc').as('getTxns');
      cy.wait('@getTxns');

      cy.logout();
    });

    it('should load a new set of questions if authentication failed and display an error message indicating the answers are incorrect', () => {
      cy.server();
      cy.route('POST', '/api/v1/applicants/*/authenticate').as('initAuthentication');

      cy.login(email, password);

      cy.selectAuthenticationResponses();

      cy.route({
        method: 'PUT',
        url: '/api/v1/applicants/*/authenticate',
        response: 'fixture:authenticate_applicant/authentication_failed.json',
        status: 200
      }).as('authenticate');

      authenticateApplicantPage.submitForm();

      cy.wait('@authenticate').then((xhr: WaitXHR) => {
        expect(xhr.status).to.equal(200);
        expect(xhr.responseBody['data'].authenticated).to.equal(false);
      });

      cy.wait('@initAuthentication').then((xhr: WaitXHR) => {
        expect(xhr.status).to.equal(200);
      });

      authenticateApplicantPage.incorrectAnswersErrorVisible();
    });

    it('should redirect to the dashboard on successful authentication', () => {
      cy.server();
      cy.route('POST', '/api/v1/applicants/*/authenticate').as('initAuthentication');

      cy.login(email, password);

      cy.selectAuthenticationResponses();

      cy.route('PUT', '/api/v1/applicants/*/authenticate').as('authenticate');

      authenticateApplicantPage.submitForm();

      cy.wait('@authenticate').then((xhr: WaitXHR) => {
        expect(xhr.status).to.equal(200);
        expect(xhr.responseBody['data'].authenticated).to.equal(true);
      });

      cy.contains('Processing information');
      cy.contains('Thank You! We are now processing your information.');

      cy.route('GET', '/api/v1/transactions?limit=25&offset=0&order_by=created_at&order_direction=desc').as('getTxns');
      cy.wait('@getTxns');

      cy.logout();
    });
  });
});
