# frozen_string_literal: true

# rubocop:disable Metrics/ModuleLength
module CommonFlowHelper
  # Common to both BillMarket and WCA flows
  def common_flow_setup
    @ft = load_fixture('bill_market_flow_fixture', 'happy_path')
    @partner_id = ENV['E2E_PARTNER_ID'] || 'p_7J9FJv6qpnG8Q8E2'

    @access_token = access_token_after_sandbox_reset
  end

  def onboard_and_certification
    puts '', 'Certification:', ''
    # About Your Business Form: POST /merchant_queries
    merchants = post_merchant_queries(@ft.merchant_queries_payload)
    refute_empty merchants
    puts "\u{2714} 1) About Your Business Form"

    # Select Merchant from modal list: post merchant_queries/:query_id/select
    query_id = merchants[:query_id]
    selection = merchants[:results].first[:id]
    merchant = post_merchant_queries_select(@ft.merchant_queries_select_payload.merge('query_id' => query_id, 'id' => selection).symbolize_keys)
    refute_empty merchant
    puts "\u{2714} 2) Select Merchant Picker"

    # About You Form: POST /applicants
    applicant = post_create_applicant(@ft.create_applicant_payload.merge('merchant_guid' => merchant[:id]).symbolize_keys)
    refute_empty applicant
    puts "\u{2714} 3) About You Form"

    # authenticate applicant: POST /applicants/:applicant_guid/authenticate
    authenticated_applicant = post_authenticate_applicant(applicant_guid: applicant[:id], language: 'French')

    answers = []
    authenticated_applicant[:questions].each do |question|
      question[:answers].each do |answer|
        answers[question[:id] - 1] = answer[:id] if answer[:correct_answer]
      end
    end
    puts "\u{2714} 4) EID"
    # authenticate applicant: PUT /applicants/:applicant_guid/authenticate
    put_authenticate_applicant(applicant_guid: applicant[:id],
                               authentication_query_guid: authenticated_applicant[:guid],
                               applicant_responses: answers)

    # Certified: poll offers -> get /lending/offers
    # poll for 1/2 minute (TODO: should be the same time as real polling)
    lending_offers = []
    i = 0
    while lending_offers.empty? && i < 40
      puts "\u{3030}Polling for offer..."
      lending_offers = get_lending_offers(merchant_id: merchant[:id])
      i += 1
      sleep 3
    end
    refute_empty lending_offers
    puts "\u{2714} 5) Certified"
    merchant
  end

  def assert_offers_and_select(merchant_guid, payee_type)
    lending_offers = get_lending_offers(merchant_id: merchant_guid)
    refute_empty lending_offers
    selected_offer = lending_offers.find { |off| off[:application_prerequisites][:payee] == payee_type }
    offer = get_lending_offer(id: selected_offer[:id])
    refute_empty offer
    offer
  end

  def send_request(method, url, user_access_token, payload)
    RestClient::Request.execute(
      method: method,
      url: url,
      payload: payload,
      headers: { authorization: "Bearer #{user_access_token}" }
    )
  rescue Errno::ECONNREFUSED, Errno::ECONNRESET, RestClient::Exception => e
    Rails.logger.error("Error transferring file (#{method}, #{url}): #{e.message}")
  end

  def send_tax_assessment(app_guid, merchant_guid)
    @file_contents = 'My CRA Tax assessment'
    @file = Tempfile.new
    @file.puts(@file_contents)
    @file.rewind
    key = "#{Dir.tmpdir}#{File::SEPARATOR}#{SecureRandom.uuid}"
    FileUtils.cp(@file.path, key)

    files = [{
      lookup_key: @file.path,
      report_type: 'cra_tax_assessment',
      destination: 'zetatango'
    }]
    params = { source_guid: app_guid,
               file_owner: merchant_guid,
               files: files }
    res = send_request(:post, file_upload_url, @access_token, params)
    assert_equal 201, res.code
  end

  def invite_and_accept_partner_admin(name, email, pwd, attributes, session = :default)
    internal_log_in('e2e-admin@arioplatform.com', ENV.fetch('E2E_ADMIN_PASSWORD'))
    visit internal_url
    assert_match 'Welcome, E2E Admin!', page.body
    puts "\u{2714} Internal portal login"

    add_partner_admin(name, email, attributes)

    assert_match name, page.body
    assert_match email, page.body

    # TODO : fix this to be able to test with email in the new e2e env
    assert_match 'Welcome to Thinking Capital!', last_email
    puts "\u{2714} Added a new partner administrator"

    # Find link used for set password button from the welcome email  ....

    Capybara.using_session(session) do
      follow_link_from_last_email
      fill_in 'user_password', with: pwd
      check 'Partner_ToS_checkbox'
      click_on 'Create account'
    end
  end

  def follow_link_from_last_email
    path_regex = %r{(?:"https?://.*?)(/.*?)(?:")}
    email_link = last_email.match(path_regex)[0]
    visit email_link.delete('"')
  end

  def visit_user_idp_and_sign_in(email, pwd, idp_sign_in_page, session = :default)
    Capybara.using_session(session) do
      visit idp_sign_in_page
      fill_in 'Email', with: email
      fill_in 'Password', with: pwd
      click_on 'Sign in'
    end
  end

  def navigate_to_merchant
    # not displayed if there is only one campaign
    click_link 'BillMarket Campaign' if page.has_link?('BillMarket Campaign')

    click_on 'List merchants in campaign'
    click_on 'DUNDEE BANCORP INC'
  end
end
# rubocop:enable Metrics/ModuleLength
