// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

import 'cypress-file-upload';

Cypress.Commands.add('login', (email, password) => {
  cy.visit('http://dreampayments.zetatango.local:3001/');
  cy.get('#link-sign-in-landing').click();
  cy.get('#user_email').clear().type(email, { delay: 0 }).should('have.value', email);
  cy.get('#user_password').clear().type(password, { delay: 0 }).should('have.value', password);
  cy.get('#btn-sign-in').click();
});

Cypress.Commands.add('logout', () => {
  cy.get('.navbar #dropdown-user-menu .dropdown-toggle').click();
  cy.get('.navbar #dropdown-user-menu .dropdown-menu #link-sign-out').click();
});

Cypress.Commands.add('dismissErrorDialog', () => {
  cy.get('.modal-footer').find('button').should('be.visible');
  cy.get('.modal-footer').find('button').contains('OK').click();
});

Cypress.Commands.add('signIn', () => {
  cy.visit('http://dreampayments.zetatango.local:3001/');
  cy.get('#link-sign-in-landing').click();
});

Cypress.Commands.add('signUp', () => {
  cy.visit('http://dreampayments.zetatango.local:3001/');
  cy.get('#link-sign-up-landing-1').click();
});

Cypress.Commands.add('signUpCfa', () => {
  cy.visit('http://id.ztt-auth.zetatango.local:3002/users/cfa_sign_up?partner=p_7J9FJv6qpnG8Q8E2');
});

Cypress.Commands.add('getAccessToken', () => {
  return cy.request({
    method: 'POST',
    url: 'http://id.ztt-auth.zetatango.local:3002/oauth/token',
    body: {
      client_id: Cypress.env('TOKEN_CLIENT_ID'),
      client_secret: Cypress.env('TOKEN_CLIENT_SECRET'),
      scope: 'ztt:test',
      grant_type: 'client_credentials'
    }
  });
});

Cypress.Commands.add('parseAccessToken', (tokenResponse) => {
  return {
    token: tokenResponse['access_token'],
    expires: new Date().getTime() + tokenResponse['expires_in'],
    expires_in: tokenResponse['expires_in']
  };
});

Cypress.Commands.add('createConfirmedUser', (accessToken, email) => {
  return cy.request({
    method: 'POST',
    url: 'http://dev.zetatango.local:3000/api/e2e/init',
    body: {
      user: {
        name: 'John Smith',
        email: email,
        password: Cypress.env('E2E_ADMIN_PASSWORD'),
        enabled: true,
        role: 'merchant_new',
        confirmed_at: (new Date().getTime()) / 1000
      }
    },
    headers: {
      authorization: 'Bearer ' + accessToken
    }
  });
});

Cypress.Commands.add('createConfirmedUserWithMerchant', (accessToken, email) => {
  return cy.request({
    method: 'POST',
    url: 'http://dev.zetatango.local:3000/api/e2e/init',
    body: {
      user: {
        name: 'John Smith',
        email: email,
        password: Cypress.env('E2E_ADMIN_PASSWORD'),
        enabled: true,
        role: 'merchant_new',
        confirmed_at: (new Date().getTime()) / 1000
      },
      merchant: {
        name: 'ARCIS CORPORATION',
        phone_number: '(403) 781-1712',
        doing_business_as: 'E2E ARCIS CORPORATION' + new Date().getTime(),
        industry: 'APPAREL_AND_ACCESSORIES',
        address: {
          address_line_1: '300 6 Ave SW',
          city: 'CALGARY',
          state_province: 'AB',
          postal_code: 'T2P 0R9',
          country: 'CA'
        }
      }
    },
    headers: {
      authorization: 'Bearer ' + accessToken
    }
  });
});

Cypress.Commands.add('createConfirmedUserWithMerchantAndApplicant', (accessToken, email, kycStatus = null, bankAccount = null, businessPartner = null, merchant = {}) => {
  return cy.request({
    method: 'POST',
    url: 'http://dev.zetatango.local:3000/api/e2e/init',
    body: {
      user: {
        name: 'John Smith',
        email: email,
        password: Cypress.env('E2E_ADMIN_PASSWORD'),
        enabled: true,
        role: 'merchant_new',
        confirmed_at: (new Date().getTime()) / 1000
      },
      merchant: {
        name: merchant.name || 'ARCIS CORPORATION',
        phone_number: merchant.phone_number || '(403) 781-1712',
        doing_business_as: (merchant.doing_business_as || 'E2E ARCIS CORPORATION') + new Date().getTime(),
        industry: merchant.industry || 'APPAREL_AND_ACCESSORIES',
        address: {
          address_line_1: merchant.address_line_1 || '300 6 Ave SW',
          city: merchant.city ||'CALGARY',
          state_province: merchant.state_province ||'AB',
          postal_code: merchant.postal_code ||'T2P 0R9',
          country: merchant.country || 'CA'
        },
        kyc: kycStatus,
        selected_bank_account: bankAccount,
        business_partner: businessPartner
      },
      applicant: {
        first_name: "MARY",
        last_name: "ROBERTS",
        date_of_birth: "29-03-1966",
        phone_number: "(403) 781-1712",
        owner_since: "05-01-2019",
        address: {
          address_line_1: "311 Aurora Dr SE",
          city: "HIRI",
          state_province: "AB",
          postal_code: "T1V 1J5",
          country: 'CA'
        }
      }
    },
    headers: {
      authorization: 'Bearer ' + accessToken
    }
  });
});

Cypress.Commands.add('acceptApplication', (accessToken, merchant_id) => {
  return cy.request({
    method: 'POST',
    url: 'http://dev.zetatango.local:3000/api/e2e/accept_last_application',
    body: { merchant_id: merchant_id },
    headers: {
      authorization: 'Bearer ' + accessToken
    }
  });
});

Cypress.Commands.add('switchProductConfigurations', (accessToken, productConfigurations) => {
  return cy.request({
    method: 'POST',
    url: 'http://dev.zetatango.local:3000/api/e2e/switch_products',
    body: { product_configurations: productConfigurations },
    headers: {
      authorization: 'Bearer ' + accessToken
    }
  });
});

Cypress.Commands.add('recertify', (accessToken, merchant_id, offer_state, flinks_status = null) => {
  return cy.request({
    method: 'POST',
    url: 'http://dev.zetatango.local:3000/api/e2e/recertify',
    body: {
      merchant_id: merchant_id,
      offer_state: offer_state,
      flinks_status: flinks_status
    },
    headers: {
      authorization: 'Bearer ' + accessToken
    }
  });
});

Cypress.Commands.add('confirmUserEmail', () => {
  cy.request('GET', 'http://dreampayments.zetatango.local:3000/letter_opener')
    .then((response) => {
      expect(response.body).to.include('<iframe name="mail" id="mail"');
      const mailFrame = response.body.match(/<iframe name="mail" id="mail" src="\/letter_opener\/[0-9a-z_]+\/rich"><\/iframe>/i);
      expect(mailFrame).to.not.be.null;
      if (mailFrame && mailFrame[0]) {
        const mailPath = mailFrame[0].match(/\/letter_opener\/[0-9a-z_]+\//i);
        expect(mailPath).to.not.be.null;

        cy.request('GET', 'http://dreampayments.zetatango.local:3000' + mailPath[0])
          .then((response) => {
            expect(response.body).to.include('Please confirm your email address');
            const url = response.body.match(/(?<=\&quot\;)http:\/\/[0-9a-z\.\-\:=\?_\/&\;]+zetatango[0-9a-z\.\-\:=\?_\/&\;]+(?=\&quot\;)/i);
            expect(url).to.not.be.null;

            cy.request('GET', url[0])
              .then((response) => {
                return response.body;
              });
          });
      }
    });
});

Cypress.Commands.add('clearEmails', () => {
  cy.request('GET', 'http://dreampayments.zetatango.local:3000/letter_opener')
    .then((response) => {
      const csrfMetaTag = response.body.match(/<meta name="csrf-token" content="[0-9a-z\/\+=]+"/i);
      expect(csrfMetaTag).to.not.be.null;
      if (csrfMetaTag && csrfMetaTag[0]) {
        const csrfToken = csrfMetaTag[0].match(/content="[0-9a-z\/\+=]+/i)[0].substring(9);
        expect(csrfToken).to.not.be.null;
        cy.request({
          url: 'http://dreampayments.zetatango.local:3000/letter_opener/clear',
          method: 'DELETE',
          form: true,
          body: {
            _method: 'delete',
            authenticity_token: csrfToken
          }
        });
      }
    });
});

Cypress.Commands.add('fillAboutBusinessForm', (businessInfo) => {
  cy.get('[formcontrolname="name"]').clear().type(businessInfo.name).should('have.value', businessInfo.name);
  cy.get('[formcontrolname="phone_number"]').clear().clear().type(businessInfo.phone_number).should('have.value', businessInfo.formatted_phone_number);
  cy.get('[formcontrolname="doing_business_as"]').clear().type(businessInfo.doing_business_as).should('have.value', businessInfo.doing_business_as);
  cy.get('[formcontrolname="industry"]').select(businessInfo.industry).should('have.value', businessInfo.industry_value);
  cy.get('[formcontrolname="business_num"]').clear().type(businessInfo.business_num).should('have.value', businessInfo.business_num);
  cy.get('[formcontrolname="incorporated_in"]').select(businessInfo.incorporated_in).should('have.value', businessInfo.incorporated_in);
  cy.get('[formcontrolname="self_attested_date_established"] input').type(businessInfo.self_attested_date_established).should('have.value', businessInfo.self_attested_date_established);
  cy.get('[formcontrolname="self_attested_average_monthly_sales"]').clear().type(businessInfo.self_attested_average_monthly_sales).should('have.value', businessInfo.self_attested_average_monthly_sales);
  cy.get('[formcontrolname="address_line_1"]').clear().type(businessInfo.address_line_1).should('have.value', businessInfo.address_line_1);
  cy.get('[formcontrolname="city"]').clear().type(businessInfo.city).should('have.value', businessInfo.city);
  cy.get('[formcontrolname="state_province"]').select(businessInfo.state_province).should('have.value', businessInfo.state_province);
  cy.get('[formcontrolname="postal_code"]').clear().type(businessInfo.postal_code).should('have.value', businessInfo.postal_code);
});

Cypress.Commands.add('fillAboutBusinessFormNoSelects', (businessInfo) => {
  cy.get('[formcontrolname="name"]').clear().type(businessInfo.name).should('have.value', businessInfo.name);
  cy.get('[formcontrolname="phone_number"]').clear().clear().type(businessInfo.phone_number).should('have.value', businessInfo.formatted_phone_number);
  cy.get('[formcontrolname="doing_business_as"]').clear().type(businessInfo.doing_business_as).should('have.value', businessInfo.doing_business_as);
  cy.get('[formcontrolname="business_num"]').clear().type(businessInfo.business_num).should('have.value', businessInfo.business_num);
  cy.get('[formcontrolname="address_line_1"]').clear().type(businessInfo.address_line_1).should('have.value', businessInfo.address_line_1);
  cy.get('[formcontrolname="city"]').clear().type(businessInfo.city).should('have.value', businessInfo.city);
  cy.get('[formcontrolname="postal_code"]').clear().type(businessInfo.postal_code).should('have.value', businessInfo.postal_code);
});

Cypress.Commands.add('performAboutBusinessFormValidation', (businessInfo) => {
  cy.get('[formcontrolname="name"]').clear().should('have.value', '');
  cy.contains('Next').click();
  cy.get('[formcontrolname="name"] + .invalid-feedback').should('contain', 'Required.').should('be.visible');

  cy.get('[formcontrolname="name"]').clear().type(businessInfo.name).should('have.value', businessInfo.name);
  cy.get('[formcontrolname="phone_number"]').clear().clear().should('have.value', '');
  cy.contains('Next').click();
  cy.get('[formcontrolname="phone_number"] + .invalid-feedback').should('contain', 'Invalid phone number.').should('be.visible');

  cy.get('[formcontrolname="phone_number"]').clear().clear().type(businessInfo.phone_number).should('have.value', businessInfo.formatted_phone_number);
  cy.get('[formcontrolname="doing_business_as"]').clear().should('have.value', '');
  cy.contains('Next').click();
  cy.get('[formcontrolname="doing_business_as"] + .invalid-feedback').should('contain', 'Required.').should('be.visible');

  cy.get('[formcontrolname="doing_business_as"]').clear().type(businessInfo.doing_business_as).should('have.value', businessInfo.doing_business_as);
  cy.get('[formcontrolname="industry"] + .invalid-feedback').should('contain', 'Required.').should('be.visible');

  cy.get('[formcontrolname="industry"]').select(businessInfo.industry).should('have.value', businessInfo.industry_value);
  cy.get('[formcontrolname="incorporated_in"] + .invalid-feedback').should('contain', 'Select the jurisdiction.')
    .should('be.visible');

  cy.get('[formcontrolname="business_num"]').clear().should('have.value', '');
  // Federal jurisdiction
  cy.get('[formcontrolname="incorporated_in"]').select('CD').should('have.value', 'CD');
  cy.get('[formcontrolname="business_num"] + .invalid-feedback').should('contain', 'Only numbers and dashes allowed.')
    .should('be.visible');

  // Alberta
  cy.get('[formcontrolname="incorporated_in"]').select('AB').should('have.value', 'AB');
  cy.get('[formcontrolname="business_num"] + .invalid-feedback').should('contain', 'Valid characters are A-Z a-z 0-9')
    .should('be.visible');

  // BC
  cy.get('[formcontrolname="incorporated_in"]').select('BC').should('have.value', 'BC');
  cy.get('[formcontrolname="business_num"] + .invalid-feedback').should('contain', 'Valid characters are A-Z a-z 0-9')
    .should('be.visible');

  // Manitoba
  cy.get('[formcontrolname="incorporated_in"]').select('MB').should('have.value', 'MB');
  cy.get('[formcontrolname="business_num"] + .invalid-feedback').should('contain', 'Only numbers allowed.')
    .should('be.visible');

  // New Brunswick
  cy.get('[formcontrolname="incorporated_in"]').select('NB').should('have.value', 'NB');
  cy.get('[formcontrolname="business_num"] + .invalid-feedback').should('contain', 'Valid characters are A-Z a-z 0-9')
    .should('be.visible');

  // Newfoundland and Labrador
  cy.get('[formcontrolname="incorporated_in"]').select('NL').should('have.value', 'NL');
  cy.get('[formcontrolname="business_num"] + .invalid-feedback').should('contain', 'Valid characters are A-Z a-z 0-9')
    .should('be.visible');

  // Northwest Territories
  cy.get('[formcontrolname="incorporated_in"]').select('NT').should('have.value', 'NT');
  cy.get('[formcontrolname="business_num"] + .invalid-feedback').should('contain', 'Only numbers allowed.')
    .should('be.visible');

  // Nova Scotia
  cy.get('[formcontrolname="incorporated_in"]').select('NS').should('have.value', 'NS');
  cy.get('[formcontrolname="business_num"] + .invalid-feedback').should('contain', 'Only numbers allowed.')
    .should('be.visible');

  // Nunavut
  cy.get('[formcontrolname="incorporated_in"]').select('NU').should('have.value', 'NU');
  cy.get('[formcontrolname="business_num"] + .invalid-feedback').should('contain', 'Only numbers allowed.')
    .should('be.visible');

  // Ontario
  cy.get('[formcontrolname="incorporated_in"]').select('ON').should('have.value', 'ON');
  cy.get('[formcontrolname="business_num"] + .invalid-feedback').should('contain', 'Only numbers allowed.')
    .should('be.visible');

  // PEI
  cy.get('[formcontrolname="incorporated_in"]').select('PE').should('have.value', 'PE');
  cy.get('[formcontrolname="business_num"] + .invalid-feedback').should('contain', 'Only numbers allowed.')
    .should('be.visible');

  // Quebec
  cy.get('[formcontrolname="incorporated_in"]').select('QC').should('have.value', 'QC');
  cy.get('[formcontrolname="business_num"] + .invalid-feedback').should('contain', 'Only numbers allowed.')
    .should('be.visible');

  // Saskatchewan
  cy.get('[formcontrolname="incorporated_in"]').select('SK').should('have.value', 'SK');
  cy.get('[formcontrolname="business_num"] + .invalid-feedback').should('contain', 'Only numbers allowed.')
    .should('be.visible');

  // Yukon
  cy.get('[formcontrolname="incorporated_in"]').select('YT').should('have.value', 'YT');
  cy.get('[formcontrolname="business_num"] + .invalid-feedback').should('contain', 'Only numbers allowed.')
    .should('be.visible');

  cy.get('[formcontrolname="incorporated_in"]').select(businessInfo.incorporated_in).should('have.value', businessInfo.incorporated_in);
  cy.get('[formcontrolname="business_num"]').clear().type(businessInfo.business_num).should('have.value', businessInfo.business_num);

  cy.get('[formcontrolname="self_attested_date_established"] input').clear().should('have.value', '');
  cy.contains('Next').click();
  cy.get('ztt-date-picker[formcontrolname="self_attested_date_established"] + .invalid-feedback').should('contain', 'Required.').should('be.visible');
  cy.get('[formcontrolname="self_attested_date_established"] input').type(businessInfo.self_attested_date_established).should('have.value', businessInfo.self_attested_date_established);

  cy.get('[formcontrolname="self_attested_average_monthly_sales"]').clear().should('have.value', '');
  cy.contains('Next').click();
  cy.get('[formcontrolname="self_attested_average_monthly_sales"] + .invalid-feedback').should('contain', 'Required.').should('be.visible');
  cy.get('[formcontrolname="self_attested_average_monthly_sales"]').clear().type(businessInfo.self_attested_average_monthly_sales).should('have.value', businessInfo.self_attested_average_monthly_sales);

  cy.get('[formcontrolname="address_line_1"]').clear().should('have.value', '');
  cy.contains('Next').click();
  cy.get('[formcontrolname="address_line_1"] + .invalid-feedback').should('contain', 'Required.').should('be.visible');

  cy.get('[formcontrolname="address_line_1"]').clear().type(businessInfo.address_line_1).should('have.value', businessInfo.address_line_1);
  cy.get('[formcontrolname="city"]').clear().should('have.value', '');
  cy.contains('Next').click();
  cy.get('[formcontrolname="city"] + .invalid-feedback').should('contain', 'Required.').should('be.visible');

  cy.get('[formcontrolname="city"]').clear().type(businessInfo.city).should('have.value', businessInfo.city);
  cy.contains('Next').click();
  cy.get('[formcontrolname="state_province"] + .invalid-feedback').should('contain', 'Required.').should('be.visible');

  cy.get('[formcontrolname="state_province"]').select(businessInfo.state_province).should('have.value', businessInfo.state_province);
  cy.get('[formcontrolname="postal_code"]').clear().should('have.value', '');
  cy.contains('Next').click();
  cy.get('[formcontrolname="postal_code"] + .invalid-feedback').should('contain', 'Required.').should('be.visible');
});

Cypress.Commands.add('fillAboutYouForm', (applicantInfo) => {
  cy.get('[formcontrolname="first_name"]').clear().type(applicantInfo.first_name).should('have.value', applicantInfo.first_name);
  cy.get('[formcontrolname="last_name"]').clear().type(applicantInfo.last_name).should('have.value', applicantInfo.last_name);
  cy.get('[formcontrolname="date_of_birth"] input').clear().type(applicantInfo.dob).should('have.value', applicantInfo.formatted_dob);
  cy.get('[formcontrolname="phone_number"]').clear().clear().type(applicantInfo.phone_number).should('have.value', applicantInfo.formatted_phone_number);
  cy.get('[formcontrolname="owner_since"] input').clear().type(applicantInfo.owner_since).should('have.value', applicantInfo.formatted_owner_since);
  cy.get('[formcontrolname="address_line_1"]').clear().type(applicantInfo.address).should('have.value', applicantInfo.address);
  cy.get('[formcontrolname="city"]').clear().type(applicantInfo.city).should('have.value', applicantInfo.city);
  cy.get('[formcontrolname="state_province"]').select(applicantInfo.province).should('have.value', applicantInfo.province);
  cy.get('[formcontrolname="postal_code"]').clear().type(applicantInfo.postal_code).should('have.value', applicantInfo.formatted_postal_code);
});

Cypress.Commands.add('fillAboutYouFormNoSelectedProvince', (applicantInfo) => {
  cy.get('[formcontrolname="first_name"]').clear().type(applicantInfo.first_name).should('have.value', applicantInfo.first_name);
  cy.get('[formcontrolname="last_name"]').clear().type(applicantInfo.last_name).should('have.value', applicantInfo.last_name);
  cy.get('[formcontrolname="date_of_birth"] input').clear().type(applicantInfo.dob).should('have.value', applicantInfo.formatted_dob);
  cy.get('[formcontrolname="phone_number"]').clear().clear().type(applicantInfo.phone_number).should('have.value', applicantInfo.formatted_phone_number);
  cy.get('[formcontrolname="owner_since"] input').clear().type(applicantInfo.owner_since).should('have.value', applicantInfo.formatted_owner_since);
  cy.get('[formcontrolname="address_line_1"]').clear().type(applicantInfo.address).should('have.value', applicantInfo.address);
  cy.get('[formcontrolname="city"]').clear().type(applicantInfo.city).should('have.value', applicantInfo.city);
  cy.get('[formcontrolname="postal_code"]').clear().type(applicantInfo.postal_code).should('have.value', applicantInfo.formatted_postal_code);
});

Cypress.Commands.add('performAboutYouFormValidation', (applicantInfo) => {
  cy.get('[formcontrolname="first_name"]').clear().should('have.value', '');
  cy.contains('Next').click();
  cy.get('[formcontrolname="first_name"] + .invalid-feedback').should('contain', 'Required.').should('be.visible');

  cy.get('[formcontrolname="first_name"]').clear().type(applicantInfo.first_name).should('have.value', applicantInfo.first_name);
  cy.get('[formcontrolname="last_name"]').clear().should('have.value', '');
  cy.contains('Next').click();
  cy.get('[formcontrolname="last_name"] + .invalid-feedback').should('contain', 'Required.').should('be.visible');

  cy.get('[formcontrolname="last_name"]').clear().type(applicantInfo.last_name).should('have.value', applicantInfo.last_name);
  cy.get('[formcontrolname="date_of_birth"] input').clear().should('have.value', '');
  cy.contains('Next').click();
  cy.get('[formcontrolname="date_of_birth"] + .invalid-feedback').should('contain', 'Invalid date of birth').should('be.visible');

  cy.get('[formcontrolname="date_of_birth"] input').clear().type(applicantInfo.dob).should('have.value', applicantInfo.formatted_dob);
  cy.get('[formcontrolname="phone_number"]').clear().clear().should('have.value', '');
  cy.contains('Next').click();
  cy.get('[formcontrolname="phone_number"] + .invalid-feedback').should('contain', 'Invalid phone number.').should('be.visible');

  cy.get('[formcontrolname="phone_number"]').clear().clear().type(applicantInfo.phone_number).should('have.value', applicantInfo.formatted_phone_number);
  cy.get('[formcontrolname="owner_since"] input').clear().should('have.value', '');
  cy.contains('Next').click();
  cy.get('[formcontrolname="owner_since"] + .invalid-feedback').should('contain', 'Invalid date').should('be.visible');

  cy.get('[formcontrolname="owner_since"] input').clear().type(applicantInfo.owner_since).should('have.value', applicantInfo.formatted_owner_since);
  cy.get('[formcontrolname="address_line_1"]').clear().should('have.value', '');
  cy.contains('Next').click();
  cy.get('[formcontrolname="address_line_1"] + .invalid-feedback').should('contain', 'Required.').should('be.visible');

  cy.get('[formcontrolname="address_line_1"]').clear().type(applicantInfo.address).should('have.value', applicantInfo.address);
  cy.get('[formcontrolname="city"]').scrollIntoView().clear().should('have.value', '');
  cy.contains('Next').click();
  cy.get('[formcontrolname="city"] + .invalid-feedback').should('contain', 'Required.').should('be.visible');

  cy.get('[formcontrolname="city"]').clear().type(applicantInfo.city).should('have.value', applicantInfo.city);
  cy.contains('Next').click();
  cy.get('[formcontrolname="state_province"] + .invalid-feedback').should('contain', 'Required.').should('be.visible');

  cy.get('[formcontrolname="state_province"]').select(applicantInfo.province).should('have.value', applicantInfo.province);
  cy.get('[formcontrolname="postal_code"]').clear().should('have.value', '');
  cy.contains('Next').click();
  cy.get('[formcontrolname="postal_code"] + .invalid-feedback').should('contain', 'Required.').should('be.visible');
});

Cypress.Commands.add('selectAuthenticationResponses', () => {
  cy.wait('@initAuthentication').then((xhr) => {
    expect(xhr.status).to.equal(200);
    const responseData = xhr.responseBody['data'];
    expect(responseData.questions.length).to.be.greaterThan(0);
    const questions = responseData.questions;

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i].id;
      const answers = questions[i].answers;
      let answer;
      for (let j = 0; j < answers.length; j++) {
        if (answers[j].correct_answer === true) {
          answer = answers[j].id;
          break;
        }
      }

      cy.get('#question_' + question + '_answer_' + answer).check();
    }
  });
});

Cypress.Commands.add('iframeLoaded', { prevSubject: 'element' }, ($iframe) => {
  const contentWindow = $iframe.prop('contentWindow');
  return new Promise(resolve => {
    if (contentWindow && contentWindow.document.readyState === 'complete') {
      resolve(contentWindow);
    } else {
      $iframe.on('load', () => {
        resolve(contentWindow);
      });
    }
  })
});

Cypress.Commands.add('getInDocument', { prevSubject: 'document' }, (document, selector) => Cypress.$(selector, document));

Cypress.Commands.add('selectContaining', { prevSubject: 'element' }, (subject, text, options) => {
  return cy.wrap(subject).contains('option', text, options).then((option) => {
    cy.get('select').select(option.text().trim());
  }
  );
});

Cypress.Commands.add('connectBankAccount', () => {
  cy.contains('Connect Your Business Bank Account');

  cy.wait(5000);
  cy.get('iframe')
    .iframeLoaded()
    .its('document')
    .getInDocument('a[title="Flinks Capital International"]')
    .click();

  cy.get('iframe')
    .iframeLoaded()
    .its('document')
    .getInDocument('input[id="username"]')
    .type('Greatday');

  cy.get('iframe')
    .iframeLoaded()
    .its('document')
    .getInDocument('input[type="password"]')
    .type('Everyday', { force: true });

  cy.get('iframe')
    .iframeLoaded()
    .its('document')
    .getInDocument('button[type="submit"]')
    .click();

  cy.wait(8000);
  cy.get('iframe')
      .iframeLoaded()
      .its('document')
      .getInDocument('f-label')
      .invoke('text').then((question) => {
    if (question === 'What shape do people like most?') {
      cy.get('iframe')
          .iframeLoaded()
          .its('document')
          .getInDocument('input[name="mfa-QuestionAndAnswer-0"]')
          .type('Triangle', { force: true });
    } else if (question === 'What is the best country on earth?') {
      cy.get('iframe')
          .iframeLoaded()
          .its('document')
          .getInDocument('input[name="mfa-QuestionAndAnswer-0"]')
          .type('Canada', { force: true });
    } else if (question === 'What city were you born in?') {
      cy.get('iframe')
          .iframeLoaded()
          .its('document')
          .getInDocument('input[name="mfa-QuestionAndAnswer-0"]')
          .type('Montreal', { force: true });
    }

      cy.get('iframe')
        .iframeLoaded()
        .its('document')
        .getInDocument('button[type="submit"]')
        .click();
    });

  cy.wait(3500);

  cy.server();
  cy.route('GET', '/api/v1/bank_accounts').as('getBankAccounts');
  cy.wait(['@getBankAccounts', '@getBankAccounts']).then((xhrList) => {
    expect(xhrList[1].status).to.equal(200);
    expect(xhrList[1].responseBody['data'].length).to.equal(2);
  });

  cy.server();
  cy.route('POST', '/api/v1/select_bank_account').as('selectBankAccount');
  cy.get('button[id="bank-accounts-picker-btn"]', { timeout:20000} ).should('be.visible');
  cy.get('select').selectContaining('Chequing CAD');
  cy.get('.btn').contains('Use This Account').click();

  cy.wait('@selectBankAccount').then((xhr) => {
    expect(xhr.status).to.equal(200);
  });
});

Cypress.Commands.add('accessFunds', (amount) => {
  cy.get('input[formControlName="amount"]').clear().type(amount).should('have.value', amount);
  cy.get('button[data-ng-id="apply-for-offer-btn"]').contains('Request Funds').click();
});

Cypress.Commands.add('fillPayeeForm', () => {
  cy.get('#payee-supplier').click();
  cy.get('#payee > option').eq(1).then((option) => {
    cy.get('#payee').select(option.val());
  });
  cy.get('#invoiceNumber').clear().type('123').should('have.value', '123');
  cy.get('#accountNumber').clear().type('456').should('have.value', '456');
  cy.get('#select-supplier-btn').click();
});

Cypress.Commands.add('choosePayeeLoc', () => {
  // button is alraedy defaulted to pay self
  cy.get('#select-supplier-btn').click();
});

Cypress.Commands.add('fillInvoiceForm', () => {
  cy.get('#amount').clear().type('500.00').should('have.value', '500.00');
  cy.get('#select-offer-btn').click();
});

Cypress.Commands.add('reconnectBankAccount', () => {
  cy.get('.btn').contains('Reconnect').click();
  cy.contains('Connect Your Business Bank Account');

  //wait needed since there is no way of detecting that the iframe has finished loading
  cy.wait(5000);
  cy.get('iframe')
      .iframeLoaded()
      .its('document')
      .getInDocument('input[id="username"]');
});

Cypress.Commands.add('reactivate', () => {
  cy.url().should('include', '/dashboard');
  cy.get('.btn').contains('Reactivate').click();
  cy.get('h6[class=gauge-circle-subtitle]', { timeout:10000 }).should('be.visible');
})

Cypress.Commands.add('uploadFile', (fileName, mimeType) => {
  cy.get('[data-ng-id="file-uploader"]').attachFile({ filePath: fileName, mimeType: mimeType });
});

Cypress.Commands.add('dragAndDropFile', (fileName) => {
  cy.get('.dropzone').attachFile(fileName, { subjectType: 'drag-n-drop' });
});

Cypress.Commands.add('lenderLogin', (email, password) => {
  cy.visit('http://admin.dreampayments.zetatango.local:3000/');
  cy.get('a#link-partner-sign-in').click();
  cy.get('#user_email').clear().type(email).should('have.value', email);
  cy.get('#user_password').clear().type(password).should('have.value', password);
  cy.get('#btn-sign-in').click();
});

Cypress.Commands.add('loanApprovalEmail', () => {
  cy.request('GET', 'http://dreampayments.zetatango.local:3000/letter_opener')
    .then((response) => {
      expect(response.body).to.include('<iframe name="mail" id="mail"');
      const mailFrame = response.body.match(/<iframe name="mail" id="mail" src="\/letter_opener\/[0-9a-z_]+\/rich"><\/iframe>/i);
      expect(mailFrame).to.not.be.null;
      if (mailFrame && mailFrame[0]) {
        const mailPath = mailFrame[0].match(/\/letter_opener\/[0-9a-z_]+\//i);
        expect(mailPath).to.not.be.null;

        cy.request('GET', 'http://dreampayments.zetatango.local:3000' + mailPath[0])
          .then((response) => {
            expect(response.body).to.include('Your advance has now been approved!');
          });
      }
    });
});

Cypress.Commands.add('internalLogin', (email, password) => {
  cy.visit('http://dev.zetatango.local:3000/internal');
  cy.get('#user_email').clear().type(email).should('have.value', email);
  cy.get('#user_password').clear().type(password).should('have.value', password);
  cy.get('#btn-sign-in').click();
});

Cypress.Commands.add('navigateToLeads', () => {
  cy.get('a[href="/internal/leads"]').click();
});

Cypress.Commands.add('fillEditMerchantForm', (merchant) => {
  cy.server();
  cy.route('PUT', '/api/v1/merchants/*').as('updateMerchant');

  cy.fillInput('[formcontrolname="name"]', merchant.name);
  cy.fillInput('[formcontrolname="doing_business_as"]', merchant.doing_business_as);
  cy.fillInput('[formcontrolname="business_num"]', merchant.business_num);
  cy.selectFromDropdown('[formcontrolname="incorporated_in"]', merchant.incorporated_in);

  cy.fillInput('[formcontrolname="address_line_1"]', merchant.address_line_1);
  cy.selectFromDropdown('[formcontrolname="state_province"]', merchant.state_province);
  cy.fillInput('[formcontrolname="city"]', merchant.city);
  cy.fillInput('[formcontrolname="postal_code"]', merchant.postal_code);

  cy.get('button#edit-merchant-submit-btn').scrollIntoView().should('be.enabled').click();

  if (merchant.address_line_1) {
    cy.wait('@updateMerchant').then((xhr) => {
      expect(xhr.status).to.equal(200);
      expect(xhr.responseBody['data'].address.toLowerCase()).to.contains(merchant.city.toLowerCase());
      expect(xhr.responseBody['data'].address).to.contains(merchant.address_line_1).and
                                              .to.contains(merchant.postal_code.replace(' ', '')).and
                                              .to.contains(merchant.state_province);
    });
  }
});

Cypress.Commands.add('selectFromDropdown', (selectInput, value) => {
  if(value === undefined){
    cy.log(`Skipped filling ${selectInput}, with undefined`);
    return;
  }
  cy.get(selectInput)
    .scrollIntoView()
    .should('be.visible')
    .select(value)
    .should('have.value', value);
});

Cypress.Commands.add('fillInput', (input, value) => {
  if (value === undefined) {
    cy.log(`Skipped filling ${input}, with undefined`);
    return;
  }
  cy.get(input)
    .scrollIntoView()
    .should('be.visible')
    .clear().type(value, { delay: 0 })
    .should('have.value', value);
});

Cypress.Commands.add('checkDashboardAlert', (content) => {
  cy.get('.alert')
    .scrollIntoView()
    .should('be.visible')
    .contains(content);
});

Cypress.Commands.add('checkDashboardNames', (legalBusinessName) => {
  cy.get('[data-ng-id="merchant-name"]')
    .should('be.visible')
    .contains(legalBusinessName);
});

Cypress.Commands.add('clickOnEditMerchantLink', () => {
  cy.get('[data-ng-id="edit-merchant-link"]')
    .scrollIntoView()
    .should('be.visible')
    .click();
});

Cypress.Commands.add('clickOnApplyForWca', () => {
  cy.get('button[data-ng-id="apply-for-offer-btn"]')
    .contains('Get funded')
    .click();
});

Cypress.Commands.add('clickOnMyBusiness', () => {
  cy.get('a[data-ng-id="dash-link"]')
    .contains('My Business')
    .wait(500)
    .click();
});

Cypress.Commands.add('clickOnBecomeAPartner', () => {
  cy.get('a[data-ng-id="become-partner-dashboard-link"]')
    .contains('Become a Partner')
    .wait(500)
    .click();
});

Cypress.Commands.add('clickOnUploadDocuments', () => {
  cy.get('a[id="documents-dropdown-item"]')
    .contains('My Documents')
    .wait(500)
    .click();
});

Cypress.Commands.add('clickOnCashFlowAdvisor', () => {
  cy.get('a[id="insights-link"]')
    .contains('Cash Flow Advisor')
    .wait(500)
    .click();
  cy.get('div[id=ztt-insights]').should('exist');
});

Cypress.Commands.add('toggleBusinessInsights', () => {
  cy.get('input[id="insights-opt-in"]')
    .check( {force:true} )
    .should('be.checked')
  cy.get('button[type=submit]')
    .first()
    .click();
});

Cypress.Commands.add('setMinimumCashReserves', (amount) => {
  cy.get('input[formcontrolname=amount]').should('be.visible').clear();
  cy.get('input[formcontrolname=amount]').should('be.visible').type(amount).should('have.value', amount);
  cy.get('button[data-ng-id="cash-buffer-save"]')
    .click()
});

Cypress.Commands.add('setMinimumCashReservesOnInvalidInput', (invalidAmount) => {
  cy.get('input[formcontrolname=amount]').should('be.visible').clear();
  cy.get('input[formcontrolname=amount]').should('be.visible').type(invalidAmount).should('have.value', '');
  cy.get('button[data-ng-id="cash-buffer-save"]').should('be.disabled');
})

Cypress.on('uncaught:exception', () => {
  return false;
});
