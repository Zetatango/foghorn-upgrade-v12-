# frozen_string_literal: true

module InsightsHelper
  protected

  def format_response(response)
    return response if response.nil? || response[:aggregatedBankAccounts].nil?

    keys = %i[averageDailyExpenses currentBalance previousBalance currentOperatingRatio previousOperatingRatio]

    keys.each do |k|
      response[:aggregatedBankAccounts][k] = response[:aggregatedBankAccounts][k]&.round(2)
    end

    response = round_balance_projections(response)

    response[:aggregatedBankAccounts][:balance] = sort_date_asc(response[:aggregatedBankAccounts][:balance])
    response[:aggregatedBankAccounts][:projection] = sort_date_asc(response[:aggregatedBankAccounts][:projection])

    response
  end

  private

  def sort_date_asc(arr)
    arr.sort { |a, b| Time.parse(a[:date]) <=> Time.parse(b[:date]) }
  end

  # rubocop:disable Metrics/CyclomaticComplexity
  def round_balance_projections(response)
    keys = %i[credits debits operatingRatio openingBalance loBalance hiBalance]
    keys.each do |k|
      response[:aggregatedBankAccounts][:balance] = [] if response[:aggregatedBankAccounts][:balance].nil?
      response[:aggregatedBankAccounts][:balance].each do |balance|
        balance[k] = balance[k]&.round(2)
      end

      response[:aggregatedBankAccounts][:projection] = [] if response[:aggregatedBankAccounts][:projection].nil?
      response[:aggregatedBankAccounts][:projection].each do |projection|
        projection[k] = projection[k]&.round(2)
      end
    end

    response
  end
  # rubocop:enable Metrics/CyclomaticComplexity
end
