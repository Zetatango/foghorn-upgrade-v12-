# frozen_string_literal: true

module BankAccountHelper
  def verify_bank_account
    upload_supporting_document
    select_document_and_verify

    puts "\u{2714} Verified bank account"
  end

  private

  def upload_supporting_document
    @file = Tempfile.new(['bank-statement', '.pdf'])
    @file.puts('My Bank Statement')
    @file.rewind

    click_on 'Merchant Documents'
    click_on 'Add new'
    select 'Bank Statements', from: 'doc_type'
    find('.dz-hidden-input', visible: false).set(@file.path)
    click_button 'add-doc-button'
    click_button 'modal-dropzone-dialog-button'

    @filename = File.basename(@file.path)
    assert_match @filename, page.body
  end

  def select_document_and_verify
    click_on 'Banking Info'
    first(:button, 'Verify').click
    document_select = "Bank Statements - #{@filename}"
    select document_select, from: 'supporting-doc-field'
    click_button 'verify-doc-button'

    assert_match 'Verified', page.body
  end
end
